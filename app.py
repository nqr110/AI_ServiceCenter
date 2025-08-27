from flask import Flask, render_template, jsonify
import geopandas as gpd
import json
import os

app = Flask(__name__)

# 加载GeoJSON数据
@app.before_first_request
def load_data():
    global gdf
    geojson_path = os.path.join(os.path.dirname(__file__), 'data', 'jinhua.geojson')
    gdf = gpd.read_file(geojson_path)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/geojson')
def get_geojson():
    # 将GeoDataFrame转换为GeoJSON
    geojson = json.loads(gdf.to_json())
    return jsonify(geojson)

if __name__ == '__main__':
    app.run(debug=True)