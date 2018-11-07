from flask import Flask, request, send_from_directory, abort, Response, render_template, redirect
import json
import os
from flask_cors import CORS
from dbmodels import thedb
from bson import ObjectId
import datetime
import base64
import hashlib
from PIL import Image
import random
import uuid
from hashids import Hashids

app = Flask(__name__)
CORS(app)
app.config['SECRET_KEY'] = 'LSKDF*#n23oiur98rkjdfu(*YF&(uo3jkrEF'
hashsalt = 'LNn39kdnf9@#)($k2342'
serverip = '192.168.0.188:7999'
serverurl = 'http://' + serverip

APP_ROOT = os.path.dirname(os.path.abspath(__file__))
APP_STATIC = os.path.join(APP_ROOT, 'static')
UPLOAD_FOLDER = os.path.join(APP_ROOT, 'uploads')

# @app.route('/.well-known/acme-challenge/<path:verid>')
# def forverification(verid):
#     return send_from_directory(APP_STATIC + '/verif',  verid)

def to_json(data):
    return json.dumps(data) + "\n"

def resp(code, data):
    return Response(
        status=code,
        mimetype="application/json",
        headers={'Access-Control-Allow-Origin': '*'},
        response=to_json(data)
    )

@app.route('/')
def hello_world():
    return render_template('index.html')

@app.route('/m/', defaults={'path': ''})
@app.route('/m/<path:path>')
def adminpage(path):
    return render_template('admin.html')

@app.route('/place/<path:pathid>', methods=['POST'])
def getplacebyid(pathid):
    try:
        req = request.json
        code = req['code']
    except:
        return abort(401, {'Error': 'Malformed request'})
    if code != 'rebel9266!':
        return abort(400, {'Error': 'Not valid code!'})
    for place in thedb.Places.collection.find({}, {'_id': False}):
        if len(place['code']) > 6:
            place['code'] = place['code'][:-1]
        if pathid == place['code']:
            final = {}
            final['work'] = []
            chapters_arr = []
            workdict = {}

            for chapter in thedb.Chapters.collection.find({}, {'_id': False}):
                if place['code'] in chapter['place_code']:
                    workdict[chapter['work_code']] = [i for i in thedb.Works.collection.find({}, {'_id': False}) if i['code'] == chapter['work_code']][0]
                    workdict[chapter['work_code']]['chapters'] = []
                    workdict[chapter['work_code']]['chapters'].append(chapter)
                    workdict[chapter['work_code']]['author'] = \
                    [b for b in thedb.Authors.collection.find({}, {'_id': False}) if b['code'] == workdict[chapter['work_code']]['author_code']][0]
                    workdict[chapter['work_code']]['author']['rel_places'] = []

                    relworks = [w for w in thedb.Works.collection.find({}, {'_id': False}) if
                                w['author_code'] == workdict[chapter['work_code']]['author_code']]
                    for relwork in relworks:
                        relwork['the_array'] = [pl for pl in thedb.Chapters.collection.find({}, {'_id': False}) if pl['work_code'] == relwork['code']]
                        for pl1 in relwork['the_array']:
                            try:
                                k = pl1['place_code']
                                for i in k:
                                    try:
                                        workdict[chapter['work_code']]['author']['rel_places'].append([
                                                                                                          {'longitude':
                                                                                                               ib[
                                                                                                                   'longitude'],
                                                                                                           'latitude':
                                                                                                               ib[
                                                                                                                   'latitude'],
                                                                                                           'code': ib[
                                                                                                               'code']}
                                                                                                          for ib in
                                                                                                          thedb.Places.collection.find({}, {'_id': False})
                                                                                                          if ib[
                                                                                                                 'code'] == i][
                                                                                                          0])
                                        workdict[chapter['work_code']]['author']['rel_places'] = [dict(t) for t in
                                                                                                  {tuple(d.items()) for
                                                                                                   d in
                                                                                                   workdict[
                                                                                                       chapter[
                                                                                                           'work_code']][
                                                                                                       'author'][
                                                                                                       'rel_places']}]
                                    except:
                                        pass
                            except Exception as e:
                                print(e)
            place['work'] = list(workdict.values())
            return resp(200, {'Result': place})
    place['work'] = []
    return resp(200, {'Error': 'No additional information on the place', 'Result': place})

@app.route('/init', methods=['POST'])
def initialize():
    try:
        req = request.json
        code = req['code']
    except:
        return abort(401, {"Error": 'Malformed request'})
    if code != 'rebel9266!':
        return abort(400, {'Error': 'Not valid code!'})
    res = []
    authors = []
    works = []
    for place in thedb.Places.collection.find({}, {'_id': False}):
        final = {}
        final['work'] = []
        workdict = {}
        for chapter in thedb.Chapters.collection.find({}, {'_id': False}):
            if place['code'] in chapter['place_code']:
                workdict[chapter['work_code']] = [i for i in thedb.Works.collection.find({}, {'_id': False}) if i['code'] == chapter['work_code']][0]
                workdict[chapter['work_code']]['chapters'] = []
                workdict[chapter['work_code']]['chapters'].append(chapter)
                workdict[chapter['work_code']]['author'] = [b for b in thedb.Authors.collection.find({}, {'_id': False}) if b['code'] == workdict[chapter['work_code']]['author_code']][0]
                workdict[chapter['work_code']]['author']['rel_places'] = []

                relworks = [w for w in thedb.Works.collection.find({}, {'_id': False}) if w['author_code'] == workdict[chapter['work_code']]['author_code']]
                for relwork in relworks:
                    relwork['the_array'] = [pl for pl in thedb.Chapters.collection.find({}, {'_id': False}) if pl['work_code'] == relwork['code']]
                    for pl1 in relwork['the_array']:
                        try:
                            k = pl1['place_code']
                            for i in k:
                                try:
                                    workdict[chapter['work_code']]['author']['rel_places'].append([{'longitude': ib['longitude'], 'latitude': ib['latitude'], 'code': ib['code']} for ib in thedb.Places.collection.find({}, {'_id': False}) if ib['code'] == i][0])
                                    workdict[chapter['work_code']]['author']['rel_places'] = [dict(t) for t in {tuple(d.items()) for d in workdict[chapter['work_code']]['author']['rel_places']}]
                                except:
                                    pass
                        except Exception as e:
                            print(e)
        place['work'] = list(workdict.values())
        res.append(place)
    for author in thedb.Authors.collection.find({}, {'_id': False}):
        authors.append(author)
    for work in thedb.Works.collection.find({}, {'_id': False}):
        works.append(work)
    print(res)
    return resp(200, {"places": res, 'works': works, 'authors': authors})

@app.route('/work/<path:workcode>', methods=['POST'])
def getworkbyid(workcode):
    try:
        req = request.json
        code = req['code']
    except:
        return abort(401, {'Error': 'Malformed request'})
    if code != 'rebel9266!':
        return abort(400, {'Error': 'Not valid code!'})
    chapters_arr = []
    res = thedb.Works.collection.find_one({'code': workcode})
    if res != None:
        del res['_id']
        chapters = thedb.Chapters.collection.find({'work_code': res['code']})
        if chapters != None:
            for chapter in chapters:
                del chapter['_id']
                chapters_arr.append(chapter)
            res['chapters'] = chapters_arr
        author = thedb.Authors.collection.find_one({'code': res['author_code']})
        if author != None:
            del author['_id']
            res['author'] = author
            return resp(200, {'Result': res})
        else:
            return resp(201, {'Error': 'Cannot find author for work', 'Result': res})
    else:
        return abort(404, {"Error": 'No information on this ID!'})


@app.route('/author/<path:authorcode>', methods=['POST'])
def getauthorkbyid(authorcode):
    try:
        req = request.json
        code = req['code']
    except:
        return abort(401, {'Error': 'Malformed request'})
    if code != 'rebel9266!':
        return abort(400, {'Error': 'Not valid code!'})
    res = thedb.Authors.collection.find_one({'code': authorcode})
    if res != None:
        del res['_id']
        rel_works = thedb.Works.collection.find({'author_code': res['code']})
        if rel_works != None:
            res['works'] = []
            for work in rel_works:
                del work['_id']
                res['works'].append(work)
            return resp(200, {'Result': res})
        else:
            return resp(201, {'Result': res, 'Error': 'Cannot find works of this author'})
    else:
        return abort(404, {"Error": 'No information on this ID!'})

@app.route('/getquote/<path:placecode>', methods=['POST'])
def getrandomquote(placecode):
    try:
        req = request.json
        code = req['code']
    except:
        return abort(401, {'Error': 'Malformed request'})
    if code != 'rebel9266!':
        return abort(400, {'Error': 'Not valid code!'})
    res = []
    chapters = thedb.Chapters.collection.find({'place_code': placecode})
    for chapter in chapters:
        res.append(chapter['photo_caption'])
    if res != []:
        print(len(res))
        return resp(200, {'Result': random.choice(res)})
    else:
        return abort(404, {"Error": 'Cannot find any chapters!'})

@app.route('/share/<path:photoid>')
def getsharepage(photoid):
    photo = thedb.Photo.collection.find_one({'theid': photoid})
    if photo != None:
        photourl = photo['url']
        theid = photo['theid']
        return render_template('share.html', photourl=photourl, photoid=theid)
    else:
        return redirect('/', code=302)

@app.route('/upload', methods=['POST'])
def uploadimages():
    try:
        req = request.form.to_dict(flat=False)
        print(type(req), req['code'])
        code = req['code']
    except Exception as e:
        print('Exception: ', e)
        return abort(401, {'Error': 'Malformed request'})
    if code[0] != 'rebel9266!':
        print('not valid code')
        return abort(400, {'Error': 'Not valid code!'})
    try:
        image = req['file'][0]
    except:
        print('no image')
        return abort(400, {'Error': 'No image in request'})

    image_data = bytes(image[22:], encoding="ascii")
    k = uuid.uuid4()
    filename = 'seungbukgu_' + str(k)
    hashids = Hashids(salt=hashsalt)
    theid = hashids.encode(len(list(thedb.Photo.collection.find({}, {'_id': False}))))
    try:
        with open('./images/' + filename + '.jpg', 'wb') as fh:
            fh.write(base64.decodebytes(image_data))
        tosave = {
        "datetime" : datetime.datetime.now(),
        "url" : '/' + filename + '.jpg',
        "theid" : theid
        }
        saveimg = thedb.Photo.collection.insert_one(tosave)
        return resp(200, {'Result': {'path': theid}})
    except Exception as e:
        return abort(500, {'Result': 'Save Error', "Exception": e})




@app.route('/css/<path:path>')
def servesomecss(path):
    return send_from_directory(APP_STATIC + '/css',  path)

@app.route('/js/<path:path>')
def servesomejs(path):
    return send_from_directory(APP_STATIC + '/js',  path)

@app.route('/fonts/<path:path>')
def servesomefonts(path):
    return send_from_directory(APP_STATIC + '/fonts',  path)

@app.route('/img/<path:path>')
def servesomeimgs(path):
    return send_from_directory(APP_STATIC + '/img',  path)

@app.route('/images/<path:path>')
def servesharedimages(path):
    return send_from_directory('./images',  path)

if __name__ == '__main__':
    app.run(host='0.0.0.0', debug=True, port=7999)
