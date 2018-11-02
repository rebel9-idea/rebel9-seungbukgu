import pymongo
import json

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

# TEST CLASS

class Photo(Model):
    collection = maindb["photo"]
    @property
    def keywords(self):
        return self.title.split()

class Works(Model):
    collection = maindb["works"]
    @property
    def keywords(self):
        return self.title.split()

class Authors(Model):
    collection = maindb["authors"]
    @property
    def keywords(self):
        return self.title.split()

class Chapters(Model):
    collection = maindb["chapters"]
    @property
    def keywords(self):
        return self.title.split()

class Places(Model):
    collection = maindb["places"]
    @property
    def keywords(self):
        return self.title.split()