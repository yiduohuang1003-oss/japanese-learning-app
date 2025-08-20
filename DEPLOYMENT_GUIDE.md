# 日语学习网站部署指南

## 前置准备

### 1. 获取必要的API密钥

#### 百度翻译API
1. 访问 [百度翻译开放平台](https://fanyi-api.baidu.com/)
2. 注册账户并创建应用
3. 获取 `APP ID` 和 `密钥`

#### 百度语音合成API
1. 访问 [百度AI开放平台](https://ai.baidu.com/)
2. 注册账户并创建语音合成应用
3. 获取 `API Key` 和 `Secret Key`
4. 免费额度：每月50,000次调用
#### Google Cloud TTS API (可选，用于高质量语音)
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 创建项目并启用 Text-to-Speech API
3. 创建服务账户并获取API密钥

### 2. 准备GitHub仓库

1. 在GitHub上创建一个**私有仓库**
2. 将项目代码推送到仓库

## 部署步骤

### 第一步：配置Supabase项目

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 创建新项目或使用现有项目
3. 获取以下信息：
   - `Project URL` (VITE_SUPABASE_URL)
   - `Anon Key` (VITE_SUPABASE_ANON_KEY)
   - `Project Reference ID` (用于GitHub Actions)

4. 生成Supabase Access Token：
   - 访问 [Supabase Access Tokens](https://supabase.com/dashboard/account/tokens)
   - 创建新的访问令牌

### 第二步：配置GitHub Secrets

在你的GitHub仓库中，进入 `Settings` > `Secrets and variables` > `Actions`，添加以下secrets：

#### Supabase相关
- `SUPABASE_PROJECT_REF`: 你的Supabase项目引用ID
- `SUPABASE_ACCESS_TOKEN`: 你的Supabase访问令牌

#### 百度翻译API
- `BAIDU_TRANSLATE_APPID`: 你的百度翻译APP ID
- `BAIDU_TRANSLATE_KEY`: 你的百度翻译密钥

#### 百度语音合成API
- `BAIDU_TTS_API_KEY`: 你的百度语音合成API Key
- `BAIDU_TTS_SECRET_KEY`: 你的百度语音合成Secret Key
#### Google Cloud TTS (可选)
- `GOOGLE_CLOUD_API_KEY`: 你的Google Cloud API密钥

#### Netlify部署 (如果使用Netlify)
- `NETLIFY_AUTH_TOKEN`: 你的Netlify访问令牌
- `NETLIFY_SITE_ID`: 你的Netlify站点ID

### 第三步：推送代码触发部署

1. 将所有更改提交到你的仓库：
```bash
git add .
git commit -m "添加翻译和TTS功能"
git push origin main
```

2. GitHub Actions将自动运行并部署：
   - 构建前端项目
   - 部署Supabase Edge Functions
   - 设置环境变量
   - 部署到Netlify

### 第四步：验证部署

1. 检查GitHub Actions运行状态
2. 在Supabase Dashboard中确认Edge Functions已部署
3. 测试网站功能：
   - 翻译功能是否正常
   - 语音功能是否改善
   - 图片单词提取是否修复

## 故障排除

### 常见问题

#### 1. Edge Function部署失败
- 检查Supabase Access Token是否正确
- 确认Project Reference ID是否正确
- 查看GitHub Actions日志获取详细错误信息

#### 2. 翻译功能不工作
- 确认百度翻译API密钥已正确设置
- 检查API配额是否充足
- 查看浏览器控制台错误信息

#### 3. 语音功能不工作
- 确认Google Cloud API密钥已设置（如果使用）
- 检查浏览器是否支持Web Audio API
- 系统会自动回退到浏览器内置语音

#### 4. GitHub Actions权限问题
- 确认仓库是私有的且你有管理员权限
- 检查所有必要的secrets是否已设置
- 确认GitHub Actions在仓库设置中已启用

### 调试技巧

1. **查看GitHub Actions日志**：
   - 进入仓库的 `Actions` 标签
   - 点击最新的工作流运行
   - 查看每个步骤的详细日志

2. **查看Supabase Edge Function日志**：
   - 在Supabase Dashboard中进入 `Edge Functions`
   - 选择相应的函数查看日志

3. **浏览器开发者工具**：
   - 打开浏览器开发者工具
   - 查看Console和Network标签页的错误信息

## 成本估算

### 免费额度
- **GitHub Actions**: 私有仓库每月2000分钟（通常足够）
- **Supabase**: 免费层包含Edge Functions调用
- **百度翻译**: 通常有免费调用额度
- **Google Cloud TTS**: 每月免费100万字符

### 预期使用量
对于个人学习项目，所有服务的免费额度通常都是充足的。

## 维护建议

1. **定期备份数据**：使用设置页面的导出功能
2. **监控API使用量**：定期检查各API服务的使用情况
3. **更新依赖**：定期更新项目依赖以获得安全补丁
4. **性能优化**：根据用户反馈优化翻译和语音功能

## 联系支持

如果遇到问题，可以：
1. 查看GitHub Issues
2. 检查Supabase文档
3. 查看各API服务的官方文档
