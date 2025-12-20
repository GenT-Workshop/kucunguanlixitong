import { useState } from 'react'
import {
  Form,
  Input,
  InputNumber,
  Button,
  DatePicker,
  message,
  Select,
} from 'antd'
import { SaveOutlined, ReloadOutlined } from '@ant-design/icons'
import type { StockInParams } from '../../api/types'
import { stockInApi } from '../../api/stockIn'
import { mockStocks } from '../../mock/data'
import './StockIn.css'

export function StockInForm() {
  const [form] = Form.useForm()
  const [loading, setLoading] = useState(false)

  // 物料选项
  const materialOptions = mockStocks.map((stock) => ({
    value: stock.material_code,
    label: `${stock.material_code} - ${stock.material_name}`,
    stock: stock,
  }))

  // 选择物料时自动填充信息
  const handleMaterialChange = (value: string) => {
    const stock = mockStocks.find((s) => s.material_code === value)
    if (stock) {
      form.setFieldsValue({
        material_name: stock.material_name,
        current_stock: stock.current_stock,
        max_stock: stock.max_stock,
      })
    }
  }

  // 提交表单
  const handleSubmit = async (values: StockInParams & { in_time_picker?: unknown }) => {
    setLoading(true)
    try {
      const params: StockInParams = {
        material_code: values.material_code,
        in_quantity: values.in_quantity,
        in_value: values.in_value,
        in_time: values.in_time_picker
          ? (values.in_time_picker as { toISOString: () => string }).toISOString()
          : new Date().toISOString(),
      }

      const res = await stockInApi.create(params)
      if (res.code === 200) {
        message.success('入库成功！')
        form.resetFields()
      } else {
        message.error(res.message || '入库失败')
      }
    } catch {
      message.error('操作失败，请重试')
    } finally {
      setLoading(false)
    }
  }

  // 重置表单
  const handleReset = () => {
    form.resetFields()
  }

  return (
    <div className="stock-in-page">
      <header className="stock-in-page__header">
        <span className="stock-in-page__badge">Stock In</span>
        <h1 className="stock-in-page__title">新增入库</h1>
        <p className="stock-in-page__subtitle">Create Stock In Record</p>
      </header>

      <div className="stock-in-form-container">
        <Form
          form={form}
          layout="vertical"
          onFinish={handleSubmit}
          className="stock-in-form"
        >
          <div className="form-grid">
            <Form.Item
              name="material_code"
              label="物料编号"
              rules={[{ required: true, message: '请选择物料' }]}
            >
              <Select
                placeholder="请选择物料"
                options={materialOptions}
                onChange={handleMaterialChange}
                showSearch
                filterOption={(input, option) =>
                  (option?.label ?? '').toLowerCase().includes(input.toLowerCase())
                }
              />
            </Form.Item>

            <Form.Item name="material_name" label="物料名称">
              <Input disabled placeholder="自动填充" />
            </Form.Item>

            <Form.Item name="current_stock" label="当前库存">
              <InputNumber disabled style={{ width: '100%' }} placeholder="自动填充" />
            </Form.Item>

            <Form.Item name="max_stock" label="最大库存">
              <InputNumber disabled style={{ width: '100%' }} placeholder="自动填充" />
            </Form.Item>

            <Form.Item
              name="in_quantity"
              label="入库数量"
              rules={[
                { required: true, message: '请输入入库数量' },
                { type: 'number', min: 1, message: '数量必须大于0' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入入库数量"
                min={1}
              />
            </Form.Item>

            <Form.Item
              name="in_value"
              label="入库金额"
              rules={[
                { required: true, message: '请输入入库金额' },
                { type: 'number', min: 0, message: '金额不能为负数' },
              ]}
            >
              <InputNumber
                style={{ width: '100%' }}
                placeholder="请输入入库金额"
                min={0}
                precision={2}
                prefix="¥"
              />
            </Form.Item>

            <Form.Item name="in_time_picker" label="入库时间">
              <DatePicker
                showTime
                style={{ width: '100%' }}
                placeholder="默认为当前时间"
              />
            </Form.Item>
          </div>

          <div className="form-actions">
            <Button
              type="primary"
              htmlType="submit"
              loading={loading}
              icon={<SaveOutlined />}
              size="large"
            >
              确认入库
            </Button>
            <Button
              onClick={handleReset}
              icon={<ReloadOutlined />}
              size="large"
            >
              重置
            </Button>
          </div>
        </Form>
      </div>
    </div>
  )
}

export default StockInForm
