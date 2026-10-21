"""Original deterministic scores, synthesized without samples. Requires numpy and FFmpeg."""
import argparse, json, math, os, shutil, subprocess, tempfile, wave
from pathlib import Path
import numpy as np

RATE = 32000
ROOT = Path(__file__).resolve().parents[1]
RNG = np.random.default_rng(210326)

def frequency(note):
    return 440 * 2 ** ((note - 69) / 12)

def score(theme, bpm):
    beat = 60 / bpm
    duration = 16 * 4 * beat
    mix = np.zeros((round(duration * RATE), 2), dtype=np.float64)

    def add(at, note, length, voice='bell', gain=.12, pan=0):
        t = np.arange(round(length * RATE)) / RATE
        f = frequency(note)
        if voice in ('bell', 'kalimba', 'piano', 'toy'):
            decay = {'bell': 2.7, 'kalimba': 5.2, 'piano': 2.2, 'toy': 4.5}[voice]
            partials = [(1, 1), (2.01 if voice == 'bell' else 2, .32), (3.98 if voice == 'kalimba' else 3, .12)]
            sound = sum(a * np.sin(2*np.pi*f*m*t) * np.exp(-t*decay*(1+i*.8)) for i,(m,a) in enumerate(partials))
            sound *= np.minimum(t/.008, 1)
        elif voice == 'pad':
            sound = (np.sin(2*np.pi*f*t) + .24*np.sin(2*np.pi*f*1.003*t) + .12*np.sin(4*np.pi*f*t))
            sound *= np.minimum(t/.5, 1) * np.minimum((length-t)/.8, 1)
        elif voice == 'bass':
            sound = (np.sin(2*np.pi*f*t) + .3*np.sin(4*np.pi*f*t) + .12*np.sin(6*np.pi*f*t)) * np.exp(-t*4)
            sound *= np.minimum(t/.009,1)
        elif voice == 'rhodes':
            sound = np.sin(2*np.pi*f*t + 1.1*np.sin(2*np.pi*f*2*t)*np.exp(-t*5)) * np.exp(-t*3.2) * np.minimum(t/.012,1)
        elif voice == 'kick':
            sound = np.sin(2*np.pi*(48*t + 70*.025*(1-np.exp(-t/.025)))) * np.exp(-t*18)
        else:
            noise = RNG.normal(0, .45, t.size)
            sound = np.r_[0,np.diff(noise)] if voice == 'hat' else noise
            sound *= np.exp(-t*(55 if voice == 'hat' else 28)) * np.minimum(t/.002,1)
        # Every event reaches zero smoothly. Tails wrap into the start of the loop.
        sound *= np.minimum((length-t)/.035, 1) * gain
        stereo = sound[:,None] * np.array([math.sqrt((1-pan)/2),math.sqrt((1+pan)/2)])
        indices = (round(at*RATE)+np.arange(t.size)) % len(mix)
        np.add.at(mix, indices, stereo)

    for bar in range(16):
        at = bar*4*beat
        if theme == 'birthday':
            roots = [60,65,57,67,60,64,65,67]
            root = roots[bar%8]
            chord = [root,root+4,root+7,root+11] if bar%8 not in (2,) else [root,root+3,root+7,root+10]
            for j,n in enumerate(chord): add(at+j*beat, n, 2.2, 'kalimba', .16, (j-1.5)*.2)
            motif = [[72,76,79,81,79,76],[77,76,72,69,72,76],[69,72,76,79,76,72],[74,79,83,81,79,74]][bar%4]
            for j,n in enumerate(motif): add(at+[0,.5,1.5,2,2.75,3.5][j]*beat, n+(12 if bar in (7,15) and j>3 else 0), 2.4, 'bell', .075 if bar<8 else .09, (-1)**j*.25)
            for b in [0,2]: add(at+b*beat, root-12, 1.5, 'piano', .08)
            for b in [.75,2.75]: add(at+b*beat, root+12+(7 if b>2 else 0), 1.3, 'toy', .06, -.25)
            for b in [1,3]: add(at+b*beat, 60, .13, 'hat', .035)
        elif theme == 'proposal':
            root = [50,47,43,45,50,54,43,45][bar%8]
            intervals = [0,3,7,10] if bar%8==1 else [0,4,7,14]
            for j,v in enumerate(intervals):
                add(at, root+v, 4*beat+1, 'pad', .038, (j-1.5)*.25)
                add(at+j*.75*beat, root+v+12, 3.8, 'piano', .13, (j-1.5)*.15)
            motif = [[66,69,76],[66,64,62],[67,71,74],[69,73,76]][bar%4]
            for j,n in enumerate(motif): add(at+[.5,2,3][j]*beat, n+(12 if bar>=8 and j==2 else 0), 3, 'piano', .11, .2)
            if bar%2: add(at+3.5*beat, root+36, 3, 'bell', .045, -.3)
        else:
            root = [38,43,36,45][bar%4]
            for j,(b,offset) in enumerate([(0,0),(.75,12),(1.5,7),(2.5,0),(3.25,10),(3.75,12)]): add(at+b*beat,root+offset,.4,'bass',.23,0)
            chord = [root+24,root+27,root+31,root+34]
            for b in [.5,1.5,2.75,3.5]:
                for j,n in enumerate(chord): add(at+b*beat,n,.45,'rhodes',.065,(j-1.5)*.22)
            for b in range(4): add(at+b*beat,36,.3,'kick',.33)
            for b in [1,3]: add(at+b*beat,60,.16,'snare',.13)
            for b in np.arange(0,4,.5): add(at+(b+(.055 if b%1 else 0))*beat,70,.09,'hat',.045,.25)
            if bar%2==1:
                for j,n in enumerate([74,77,81,79]): add(at+(2+j*.5)*beat,n,.55,'rhodes',.08,-.25)
    wet = mix.copy()
    for delay,level in [(0.113,.08),(.227,.06),(.371,.035)]: wet += np.roll(mix,round(delay*RATE),axis=0)[:,::-1]*level
    edge = round(.012*RATE)
    ramp = np.sin(np.linspace(0, math.pi/2, edge))**2
    wet[:edge] *= ramp[:,None]; wet[-edge:] *= ramp[::-1,None]
    wet -= wet.mean(axis=0)
    wet = np.tanh(wet*1.1)
    wet *= .78/max(.01,np.abs(wet).max())
    return wet.astype(np.float32), duration

def main():
    parser=argparse.ArgumentParser()
    parser.add_argument('--ffmpeg',default=os.environ.get('FFMPEG_PATH') or shutil.which('ffmpeg'))
    args=parser.parse_args()
    if not args.ffmpeg: parser.error('Indiquer --ffmpeg ou FFMPEG_PATH. Voir AUDIO.md.')
    folder=ROOT/'public/audio'; folder.mkdir(parents=True,exist_ok=True)
    entries=[]
    with tempfile.TemporaryDirectory() as tmp:
        for theme,bpm,name in [('birthday',92,'birthday-garden'),('proposal',72,'our-constellation'),('party',112,'midnight-disco')]:
            samples,duration=score(theme,bpm)
            source=Path(tmp)/(name+'.wav')
            with wave.open(str(source),'wb') as wav:
                wav.setnchannels(2);wav.setsampwidth(2);wav.setframerate(RATE)
                wav.writeframes((samples*32767).astype('<i2').tobytes())
            target=folder/(name+'.mp3')
            subprocess.run([args.ffmpeg,'-y','-loglevel','error','-i',str(source),'-codec:a','libmp3lame','-b:a','96k','-ar',str(RATE),'-map_metadata','-1',str(target)],check=True)
            entries.append({'file':target.name,'bpm':bpm,'bars':16,'duration':round(duration,3),'bytes':target.stat().st_size,'peak':round(float(np.abs(samples).max()),3),'seam_delta':round(float(np.abs(samples[0]-samples[-1]).max()),5)})
    (folder/'scores.json').write_text(json.dumps(entries,indent=2)+'\n',encoding='utf-8')
    print(json.dumps(entries,indent=2))

if __name__=='__main__': main()
