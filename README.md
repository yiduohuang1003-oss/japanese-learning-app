# 日语单词学习网站

一个帮助学习日语单词的Web应用，支持：

- 单词录入和管理
- 图片收纳和单词提取
- 链接收纳和整理
- 用户认证和数据同步

## 技术栈

- React + TypeScript
- Tailwind CSS
- Supabase (认证和数据库)
- Vite (构建工具)

## 部署

本项目部署在 Netlify 上，支持自动部署。

## 使用方法

1. 注册/登录账户
2. 在首页输入日语单词
3. 在单词库中管理学习进度
4. 在收纳箱中整理学习素材

## 词典扩展

当前词典包含约2000个常用日语词汇。如需扩展词典：

### 方法1：直接编辑词典文件
编辑 `src/utils/dictionary.ts` 文件，在 `japaneseDict` 对象中添加新词汇：

```typescript
// 添加新词汇
'新单词': { chinese: '中文翻译', furigana: '假名读音' },
'新单词2': { chinese: '中文翻译2' }, // 不需要假名时
```

### 方法2：使用辅助函数
```typescript
import { addToDictionary, addBatchToDictionary } from './utils/dictionary';

// 添加单个词汇
addToDictionary('新单词', '中文翻译', '假名读音');

// 批量添加词汇
addBatchToDictionary([
  { japanese: '単語1', chinese: '词汇1', furigana: 'たんご1' },
  { japanese: '単語2', chinese: '词汇2', furigana: 'たんご2' }
]);
```

### 词典分类
- 基础词汇：问候语、数字、时间
- 生活词汇：家庭、食物、衣服、住所、交通
- 学习工作：学校、工作场所
- 身体健康：身体部位、感情表达
- 自然环境：天气、颜色、地理
- 动词形容词：常用动词和形容词
- 护肤化妆：美容相关词汇
- 外来语：カタカナ词汇

## 开发

```bash
npm install
npm run dev
```
