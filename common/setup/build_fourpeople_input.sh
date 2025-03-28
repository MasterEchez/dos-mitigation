# https://github.com/jitsi/jitsi-meet-torture/blob/master/scripts/psnr-build-resources.sh

FOUR_PEOPLE_Y4M="fourpeople.y4m"
FOUR_PEOPLE_MJPEG="fourpeople.mjpeg"

RAW_FRAME_DIRECTORY="raw_frames"
QR_IMAGE_DIRECTORY="qrcodes"
STAMPED_FRAME_DIRECTORY="stamped_frames"

VIDEO_SZ=1280x720
VIDEO_FPS=30

STAMPED="fourpeoplestamped.mjpeg"

# setup directories
mkdir -p $QR_IMAGE_DIRECTORY $RAW_FRAME_DIRECTORY $STAMPED_FRAME_DIRECTORY

# download and convert to 30fps + split
# curl -s https://media.xiph.org/video/derf/y4m/FourPeople_1280x720_60.y4m -o $FOUR_PEOPLE_Y4M

# split into images
RAW_FRAME_FILES_COUNT=$(ls -1 $RAW_FRAME_DIRECTORY/*.png | wc -l | tr -d '[ ]')
if [ "$RAW_FRAME_FILES_COUNT" = "0" ]
then
  ffmpeg -nostats -loglevel 0 -i $FOUR_PEOPLE_Y4M -r $VIDEO_FPS -s $VIDEO_SZ -f image2 $RAW_FRAME_DIRECTORY/%03d.png
  RAW_FRAME_FILES_COUNT=$(ls -1 $RAW_FRAME_DIRECTORY/*.png|wc -l)
fi

STAMPED_FRAME_FILES_COUNT=$(ls -1 $STAMPED_FRAME_DIRECTORY/*.png | wc -l | tr -d '[ ]')
if [ "$STAMPED_FRAME_FILES_COUNT" = "0" ]
then
    for FRAME_NUMBER in $(seq -f "%03g" $RAW_FRAME_FILES_COUNT); do
        QR_IMAGE_FILE="$QR_IMAGE_DIRECTORY/$FRAME_NUMBER.png"
        RAW_FRAME_FILE="$RAW_FRAME_DIRECTORY/$FRAME_NUMBER.png"
        STAMPED_FRAME_FILE="$STAMPED_FRAME_DIRECTORY/$FRAME_NUMBER.png"

        qrencode --size=12 --level=H -o "$QR_IMAGE_FILE" "$FRAME_NUMBER"
        ffmpeg -nostats -loglevel 0 -i $RAW_FRAME_FILE -i $QR_IMAGE_FILE -filter_complex overlay=10:10 $STAMPED_FRAME_FILE
    done
fi

ffmpeg -f image2 -framerate $VIDEO_FPS -i $STAMPED_FRAME_DIRECTORY/%03d.png -s $VIDEO_SZ -f yuv4mpegpipe -pix_fmt yuv420p $STAMPED

# rm -rf $QR_IMAGE_DIRECTORY $RAW_FRAME_DIRECTORY $STAMPED_FRAME_DIRECTORY