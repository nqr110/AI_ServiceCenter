import requests
import json
import os

def download_geojson():
    """下载金华市GeoJSON数据"""
    url = "https://geo.datav.aliyun.com/areas_v3/bound/330700_full.json"
    response = requests.get(url)
    
    if response.status_code == 200:
        # 确保data目录存在
        os.makedirs('data', exist_ok=True)
        
        # 保存到本地文件
        with open('data/jinhua.geojson', 'w', encoding='utf-8') as f:
            json.dump(response.json(), f, ensure_ascii=False, indent=2)
        print("GeoJSON数据下载完成")
        return True
    else:
        print(f"下载失败，状态码: {response.status_code}")
        return False

if __name__ == "__main__":
    download_geojson()