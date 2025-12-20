import './Background.css'

/**
 * 背景光效组件
 * 包含扫描线纹理和红蓝渐变光晕效果
 */
export function Background() {
  return (
    <div className="background">
      {/* 扫描线层 */}
      <div className="background__scanlines" />

      {/* 光晕层 */}
      <div className="background__glow background__glow--red" />
      <div className="background__glow background__glow--blue" />
      <div className="background__glow background__glow--purple" />

      {/* 噪点层 */}
      <div className="background__noise" />
    </div>
  )
}

export default Background
