from flask import Flask, render_template, jsonify
import json
import os

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('index.html')

@app.route('/api/blocks-geojson')
def get_blocks_geojson():
    """提供106个随机区块的GeoJSON数据"""
    try:
        with open('data/金华市_106个随机区块.geojson', 'r', encoding='utf-8') as f:
            geojson_data = json.load(f)
        
        return jsonify(geojson_data)
    except FileNotFoundError:
        return jsonify({"error": "GeoJSON文件未找到"}), 404
    except Exception as e:
        return jsonify({"error": f"数据加载错误: {str(e)}"}), 500

@app.route('/api/block-data')
def get_block_data():
    """提供106个区块的数据，包含真实的状态信息"""
    # 从状态文件加载真实状态数据
    district_status = load_district_status()
    
    block_data = []
    for i in range(1, 107):  # 区块1到区块106
        district_key = f"区块{i}"
        status_info = district_status.get(district_key, {'status': 'normal', 'color': '#5698c3'})
        
        block_data.append({
            "name": district_key,
            "block_id": i,
            "value": 50 + (i % 50),  # 发展指数：50-99
            "population": 10000 + (i * 5000) % 100000,  # 人口：1万-10万
            "area": 100 + (i * 20) % 500,  # 面积：100-600平方公里
            "gdp": 1000 + (i * 100) % 5000,  # GDP：1000-6000万元
            "status": status_info['status'],  # 使用真实状态
            "color": status_info['color']  # 使用真实颜色
        })
    return jsonify(block_data)

def load_district_status():
    """加载地块状态数据"""
    status_file = 'district_status.json'
    if os.path.exists(status_file):
        try:
            with open(status_file, 'r', encoding='utf-8') as f:
                return json.load(f)
        except Exception as e:
            print(f"加载状态数据失败: {e}")
    
    # 如果文件不存在或加载失败，返回默认状态
    default_status = {}
    for i in range(1, 107):
        default_status[f'区块{i}'] = {'status': 'normal', 'color': '#5698c3'}
    return default_status

@app.route('/data/geojson.json')
def get_china_geojson():
    """提供全国地图的GeoJSON数据"""
    try:
        with open('data/geojson.json', 'r', encoding='utf-8') as f:
            return f.read(), 200, {'Content-Type': 'application/json'}
    except FileNotFoundError:
        return jsonify({"error": "全国地图GeoJSON文件未找到"}), 404
    except Exception as e:
        return jsonify({"error": f"全国地图数据加载错误: {str(e)}"}), 500

# 保留原有的API端点以兼容性
@app.route('/api/jinhua-geojson')
def get_jinhua_geojson():
    """提供金华市GeoJSON数据（兼容性端点）"""
    return get_blocks_geojson()

@app.route('/api/district-data')
def get_district_data():
    """提供各区县的模拟数据（兼容性端点）"""
    return get_block_data()

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5000)