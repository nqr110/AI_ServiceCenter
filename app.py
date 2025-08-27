from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/jinhua-geojson')
def get_jinhua_geojson():
    """提供金华市GeoJSON数据"""
    try:
        with open('data/jinhua.geojson', 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)
        
        # 地名映射表
        name_mapping = {
            "婺城区": "A地",
            "金东区": "B地", 
            "兰溪市": "C地",
            "义乌市": "D地",
            "东阳市": "E地",
            "永康市": "F地",
            "浦江县": "G地",
            "武义县": "H地",
            "磐安县": "I地"
        }
        
        # 替换GeoJSON中的地名
        for feature in geojson_data['features']:
            if 'name' in feature['properties']:
                original_name = feature['properties']['name']
                if original_name in name_mapping:
                    feature['properties']['name'] = name_mapping[original_name]
        
        return jsonify(geojson_data)
    except FileNotFoundError:
        return jsonify({"error": "GeoJSON文件未找到"}), 404
    except Exception as e:
        return jsonify({"error": f"数据加载错误: {str(e)}"}), 500

@app.route('/api/district-data')
def get_district_data():
    """提供各区县的模拟数据"""
    # 模拟金华市各区县的数据
    district_data = [
        {"name": "A地", "value": 85, "population": 680000},
        {"name": "B地", "value": 72, "population": 350000},
        {"name": "C地", "value": 68, "population": 600000},
        {"name": "D地", "value": 95, "population": 1200000},
        {"name": "E地", "value": 78, "population": 850000},
        {"name": "F地", "value": 82, "population": 620000},
        {"name": "G地", "value": 65, "population": 450000},
        {"name": "H地", "value": 60, "population": 320000},
        {"name": "I地", "value": 55, "population": 220000}
    ]
    return jsonify(district_data)

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)