import os
import torch
import sys
from pydub import AudioSegment

sys.stdout = open(sys.stdout.fileno(), mode='w', encoding='utf8', buffering=1)

# https://github.com/snakers4/silero-models#text-to-speech
def silero_tts(tts, language, model, speaker):
    device = torch.device('cpu')
    torch.set_num_threads(4)
    local_file = 'model.pt'

    if not os.path.isfile(local_file):
        torch.hub.download_url_to_file(f'https://models.silero.ai/models/tts/{language}/{model}.pt',
                                    local_file)  

    model = torch.package.PackageImporter(local_file).load_pickle("tts_models", "model")
    model.to(device)

    example_text = "i'm fine thank you and you?"
    sample_rate = 48000

    audio_paths = model.save_wav(text=tts,
                                speaker=speaker,
                                sample_rate=sample_rate)

def silero_speech(text):
    silero_tts(text, "en", "v3_en", "en_18")
    sound = AudioSegment.from_file("test.wav")

    octaves = 0.02
    new_sample_rate = int(sound.frame_rate * (2.0 ** octaves))
    hipitch_sound = sound._spawn(sound.raw_data, overrides={'frame_rate': new_sample_rate})   
    hipitch_sound.export("test2.wav", format="wav")

if __name__ == "__main__":
    if len(sys.argv) > 1:
        text_to_speak = sys.argv[1]
        silero_speech(text_to_speak)
    else:
        print("Please provide a text parameter.")
