from sanic import Sanic
from sanic.response import json
from sanic_openapi import doc, swagger_blueprint, openapi_blueprint
from _data import thedata

api_endpoint = '/api0.1/'

app = Sanic()
app.blueprint(openapi_blueprint)
app.blueprint(swagger_blueprint)


@app.route('/')
async def hometest(request):
    return json({'server': 'working'})


@app.get('/init')
@doc.summary('Get initial data on places')
@doc.produces({'json': 'json'})
async def get_user(request):
    return json({'result': thedata.places})


@app.get("/user/<user_id:str>")
@doc.summary("Fetches a user by ID")
@doc.produces({ "user": { "name": str, "id": int } })
async def get_user(request, user_id):
    print(request.args)
    for k in thedata.places:
        if k['code'] == user_id:
            print(k['code'])
            return json({'theplace': k})
    return json({'theplace': 'not found'})

app.config.API_VERSION = '1.0.0'
app.config.API_TITLE = 'Seungbuk-gu API'


if __name__ == '__main__':
    app.run(host='0.0.0.0', port=8170)