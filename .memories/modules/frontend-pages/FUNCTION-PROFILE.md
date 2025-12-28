# 个人资料页面

## 概述

展示和编辑用户个人信息。

## 输入输出

| 类型 | 说明 |
|------|------|
| 输入 | 用户编辑的信息 |
| 输出 | 更新后的用户资料 |

## 核心逻辑

1. 展示用户头像、用户名、邮箱、角色
2. 支持编辑用户名和邮箱
3. 提供退出登录功能

## 关键代码

```tsx
// frontend/src/pages/Profile.tsx
const Profile = () => {
  const { user, logout, updateUser } = useUser()
}
```

## 依赖关系

- UserContext

## 注意事项

- 已移除系统设置按钮
