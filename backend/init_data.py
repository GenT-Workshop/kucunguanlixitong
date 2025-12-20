#!/usr/bin/env python
# -*- coding: utf-8 -*-
"""初始化测试物料数据"""

import os
import sys
import django

# 设置Django环境
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from apps.stock.models import Stock

# 测试物料数据
materials = [
    {
        "material_code": "M001",
        "material_name": "螺丝钉",
        "spec": "M6x20",
        "unit": "个",
        "category": "五金配件",
        "supplier": "华东五金厂",
        "max_stock": 10000,
        "min_stock": 500,
        "current_stock": 2000,
        "unit_price": 0.5,
        "stock_value": 1000.00,
    },
    {
        "material_code": "M002",
        "material_name": "电阻",
        "spec": "10K 0805",
        "unit": "个",
        "category": "电子元器件",
        "supplier": "深圳电子城",
        "max_stock": 50000,
        "min_stock": 5000,
        "current_stock": 15000,
        "unit_price": 0.02,
        "stock_value": 300.00,
    },
    {
        "material_code": "M003",
        "material_name": "铝合金板",
        "spec": "1000x500x2mm",
        "unit": "张",
        "category": "金属材料",
        "supplier": "上海金属材料公司",
        "max_stock": 500,
        "min_stock": 50,
        "current_stock": 120,
        "unit_price": 85.00,
        "stock_value": 10200.00,
    },
    {
        "material_code": "M004",
        "material_name": "润滑油",
        "spec": "5L/桶",
        "unit": "桶",
        "category": "化工材料",
        "supplier": "壳牌润滑油",
        "max_stock": 100,
        "min_stock": 10,
        "current_stock": 8,  # 低于最小库存，测试预警
        "unit_price": 120.00,
        "stock_value": 960.00,
    },
    {
        "material_code": "M005",
        "material_name": "包装纸箱",
        "spec": "40x30x20cm",
        "unit": "个",
        "category": "包装材料",
        "supplier": "杭州纸业",
        "max_stock": 2000,
        "min_stock": 200,
        "current_stock": 1800,  # 接近最大库存
        "unit_price": 3.50,
        "stock_value": 6300.00,
    },
]

def init_materials():
    """初始化物料数据"""
    created_count = 0
    skipped_count = 0

    for item in materials:
        code = item["material_code"]
        if Stock.objects.filter(material_code=code).exists():
            print(f"Material {code} exists, skipped")
            skipped_count += 1
            continue

        Stock.objects.create(**item)
        print(f"Created: {code}")
        created_count += 1

    print(f"\nDone! Created {created_count}, Skipped {skipped_count}")

if __name__ == "__main__":
    init_materials()
