from tts import *
import winsound
from pydub import AudioSegment

text = "Is there anything I can help you with today? Feel free to ask questions or give orders."
text2 = "My name is Isla, I'm an AI created by Kayoi."

while True:
    speaker = input("\nSpeaker: ")
    pitch = input("pitch: ")
    speed = input("Speed: ")
    silero_tts(text2, "en", "v3_en", "en_" + speaker) #5, 12, 16,21, 28, 38, 49, [38, 49, 59, 74, 88, 92, 107] (10,11,16,18,51,86, 92, 94, 107)
    #94, 107 [18, 5, 12, 21, 28, 38, 59, 74, 88, 92 ]
    #[18, 1.12], [38, 1.2], [59, 1.15]
    
    # Mengubah pitch audio menjadi lebih tinggi
    sound = AudioSegment.from_file("test.wav")
    octaves = -0.5

    new_sample_rate = int(sound.frame_rate * (2.0 ** octaves))

    lowpitch_sound = sound._spawn(sound.raw_data, overrides={'frame_rate': new_sample_rate})
    # modified_sound = sound._spawn(sound.raw_data, overrides={'frame_rate': int(sound.frame_rate * float(pitch))})
    # Mengubah kecepatan audio menjadi lebih lambat
    # modified_sound = modified_sound.time_stretch(float(speed))
    
    modified_sound.export("test_high_pitch_slow_speed.wav", format="wav")
    
    winsound.PlaySound("test_high_pitch_slow_speed.wav", winsound.SND_FILENAME)
