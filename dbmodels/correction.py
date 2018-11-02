import pymongo
import json
import datetime

mongo_u = 'seungbukgu'
mongo_p = '9266'
mongohost = 'localhost'

mongoconn = pymongo.MongoClient('mongodb://' + mongo_u + ':' + mongo_p + '@' + mongohost + '/seungbukgu')

maindb = mongoconn['seungbukgu']

class Model(dict):
    """
    A simple model that wraps mongodb document
    """
    __getattr__ = dict.get
    __delattr__ = dict.__delitem__
    __setattr__ = dict.__setitem__

    def save(self):
        if not self._id:
            self.collection.insert(self)
        else:
            self.collection.update(
                { "_id": ObjectId(self._id) }, self)

    def reload(self):
        if self._id:
            self.update(self.collection\
                    .find_one({"_id": ObjectId(self._id)}))

    def remove(self):
        if self._id:
            self.collection.remove({"_id": ObjectId(self._id)})
            self.clear()

class Photo(Model):
    collection = maindb["photo"]
    @property
    def keywords(self):
        return self.title.split()


testimg = {
    'datetime': datetime.datetime.now(),
    'url': '/decoded.jpg',
    'theid': '1a2b3c'
}

Photo.collection.insert_one(testimg)