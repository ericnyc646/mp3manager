#!/usr/bin/env python

# @brief   dump id3 tag info to .json file
# @version 0.1
# @author  gongqijian
# @create  2013/04/11

import os
import sys
import getopt
import json
#import jsonpickle
import eyed3

filters = ['mp3', 'Mp3', 'MP3']

def usage(errno):
    print ('Usage: id3dump [option] dir|file\n\
Option:\n\
    -h      --help      print help\n\
    -f      --force     replace exists file\n\
Example:\n\
    id3dump example.mp3')
    return errno

def proc_dir(path, force):
    for subdir, dirs, files in os.walk(path):
        for file in files:
            if file[-3:] in filters:
                proc_file('%s/%s' % (subdir, file), force)

def proc_file(file, force):
    output = "%s.json" % file

    if os.path.exists(output) and not force:
        print ("'.json' file already exists, please use '-f' or '--force' option!")
        return

    fields = {}
    subfields = {}
    tag = eyed3.load(file).tag

    fields['title'] = tag.title
    fields['track'] = tag.track_num
    fields['album'] = tag.album
    fields['artist'] = tag.artist
    fields['composer'] = tag.composer
    fields['publisher'] = tag.publisher
    fields['bpm'] = tag.bpm
    fields['cd_id'] = tag.cd_id                 # CD identifier
    fields['play_count'] = tag.play_count
    fields['version'] = tag.version
    fields['genre'] = tag.genre.name
    fields['disc_num'] = tag.disc_num

    fields['original_release_date'] = str(tag.original_release_date)  # date of original release
    fields['release_date'] = str(tag.release_date)                    # date of this versions release
    fields['recording_date'] = str(tag.recording_date)                # Recording date
    fields['isV1'] = tag.isV1()
    fields['isV2'] = tag.isV2()
    #fields['images'] = str(tag.images[0].image_data)


    for comment in tag.comments:
        subfields[comment.description if comment.description else None] = comment.text

    fields['comments'] = subfields

    subfields = {}

    for lyric in tag.lyrics:
        subfields[lyric.description if lyric.description else None] = lyric.text

    fields['lyrics'] = subfields

    subfields = {}

    for pop in tag.popularities:
        subfields[pop.description if pop.description else None] = pop.text

    fields['popularities'] = subfields

    subfields = {}

    for userframes in tag.user_text_frames:
        subfields[userframes.description if userframes.description else None] = userframes.text

    fields['user_text_frames'] = subfields

    print(json.dumps(fields))
    exit()

    with open(output, "w") as text_file:
        text_file.write(json.dumps(fields))
        text_file.close()

def main():

    try:
        opts, args = getopt.getopt(sys.argv[1:], 'hf', ['help', 'force'])
    except:
        exit(usage(2))

    if len(args) < 1:
        exit(usage(1))

    force = False

    for o, a in opts:
        if o in ("-h", "--help"):
            exit(usage(0))
        elif o in ("-f", "--force"):
            force = True

    for arg in args:
        proc_file(arg, force) if os.path.isfile(arg) else proc_dir(arg, force)

if __name__ == "__main__":
    main()