import sys
from moviepy.editor import VideoFileClip, ImageClip, CompositeVideoClip
import requests
def process_video(video_path, creative_path, top_value, width_value, height_value,output_path,horizontal_value,animationType,width,height,videotitle,description):
    start_time = 1
    end_time = 8
    animation_duration = 2
    print("videotitle",videotitle)
    # Load the main video and resize
    video = VideoFileClip(video_path)
    print("width_value",width_value,"height_value",height_value)
    print("horizontal_value",horizontal_value,"top_value",top_value)
    print("animation_type",animationType)
    # Load the creative (video or image)
    top_value = int(top_value)
    width_value = int(width_value)
    height_value = int(height_value)
    horizontal_value = int(horizontal_value)
    width = video.size[0]
    height = video.size[1]
    if creative_path.lower().endswith(('mp4', 'avi', 'mov')):
        creative = VideoFileClip(creative_path).resize(newsize=(width_value, height_value))
    else:
        creative = ImageClip(creative_path).set_duration(video.duration).resize(newsize=(int(width_value), int(height_value)))

    # Position the creative
    y = top_value * (height - height_value) / 100
    x = horizontal_value * (width - width_value) / 100
    creative = creative.set_start(start_time).set_position((x, y))

    # Apply animation
    if animationType == 'FadeIn/FadeOut':
        creative = creative.fadein(float(animation_duration)).fadeout(float(animation_duration))
    elif animationType == 'Fade Out':
        creative = creative.fadeout(float(animation_duration))
    elif animationType == 'sliding':
        creative = creative.set_position(lambda t: (0 if t < start_time else int((t - start_time) * (width - creative.size[0]) / (end_time - start_time)), y))

    # Combine video and creative
    final = CompositeVideoClip([video, creative])

    # Write final video
    final.write_videofile(output_path, codec='libx264')
    upload_to_server(output_path,videotitle,description)
    
def upload_to_server(output_file_path,videotitle,description):
    url = "http://localhost:8000/uploadVideo"  # Your Node.js upload route
    files = {'file': open(output_file_path, 'rb')}  # Open the file in binary mode
    data = {'title': videotitle, 'description': description, }

    # Make the POST request with both files and data
    response = requests.post(url, files=files, data=data)

    if response.status_code == 200:
        print("File uploaded successfully:", response.json())
    else:
        print("File upload failed with status code:", response.status_code)

if __name__ == '__main__':
    args = sys.argv[1:]
    process_video(*args)
