# 交互式 Timeline 前端开发需求文档

## 1. 项目目标

开发一个美观、现代、可交互编辑的 Timeline 前端应用，用于记录、展示和管理重点事件。用户可以在不同时间尺度下查看事件，例如 day、week、month、quarter、year，并能通过缩放和平移浏览时间轴。

应用应优先作为一个真正可用的工具，而不是展示页。首屏就是 timeline 工作区。

## 2. 推荐技术栈

优先使用：

- React + TypeScript
- Vite
- Tailwind CSS
- Zustand 或 Redux Toolkit 管理状态
- date-fns 或 dayjs 处理日期
- vis-timeline 作为底层时间轴引擎，或自研 SVG/HTML timeline

如果使用组件库，推荐：

- shadcn/ui
- Radix UI
- lucide-react 图标

如果 coder LLM 判断 `vis-timeline` 定制困难，可以自研 timeline，但必须支持：

- 横向缩放
- 横向拖拽平移
- 多时间尺度刻度
- 事件拖拽修改时间
- 事件点击编辑

## 3. 核心功能

### 3.1 时间轴展示

Timeline 应支持以下时间尺度：

- Day：按小时/天展示
- Week：按周展示，显示周内日期
- Month：按月展示，显示每周或关键日期
- Quarter：按季度展示，显示 Q1/Q2/Q3/Q4
- Year：按年展示，可跨多年浏览

用户可以通过以下方式切换尺度：

- 顶部 segmented control：Day / Week / Month / Quarter / Year
- 鼠标滚轮 + Ctrl 或触控板手势缩放
- 右上角 zoom in / zoom out 按钮
- Today 按钮快速回到今天
- Fit all 按钮自动缩放到展示所有事件

### 3.2 事件类型

支持两类事件。

#### Point Event

单个时间点事件，例如：

```ts
{
  id: string;
  title: string;
  date: string;
  type: "point";
  importance: "low" | "medium" | "high" | "critical";
  category: string;
  description?: string;
  color?: string;
  tags?: string[];
}
```

#### Range Event

有开始和结束时间的事件，例如项目阶段、实验周期：

```ts
{
  id: string;
  title: string;
  startDate: string;
  endDate: string;
  type: "range";
  importance: "low" | "medium" | "high" | "critical";
  category: string;
  description?: string;
  color?: string;
  tags?: string[];
}
```

### 3.3 事件交互

用户应能：

- 新增事件
- 编辑事件
- 删除事件
- 拖拽事件改变日期
- 拖拽 range event 两端调整开始/结束时间
- 点击事件打开编辑面板
- 双击空白区域快速创建事件
- 给事件设置颜色、分类、重要性和标签
- 搜索事件标题、描述、标签
- 按分类、重要性、标签筛选事件

### 3.4 重点事件标注

重点事件需要更醒目：

- `critical`：醒目的红色或高对比色，带图标，例如 AlertCircle
- `high`：高亮色，例如 amber / orange
- `medium`：普通强调
- `low`：低饱和度样式

重点事件可以在 timeline 上显示为：

- 更大的 marker
- 左侧或顶部 pin
- hover 时显示 tooltip
- 点击后在右侧 detail panel 展示完整信息

### 3.5 多轨道 Lane

支持按分类分轨道展示，例如：

- Work
- Research
- Paper
- Dataset
- Meeting
- Deadline
- Personal

用户可以选择：

- Compact mode：所有事件压缩在同一时间轴
- Lane mode：按分类分轨道展示

Lane mode 下，左侧固定显示分类名，右侧是对应时间轴。

### 3.6 右侧详情面板

点击事件后，右侧滑出详情面板。

详情面板包含：

- 标题输入框
- 类型选择：Point / Range
- 日期选择器
- 开始时间 / 结束时间
- 重要性选择
- 分类选择
- 颜色选择
- 标签编辑
- 描述 Markdown textarea
- 保存按钮
- 删除按钮

不要用浏览器原生丑陋表单，使用统一设计的组件。

### 3.7 顶部工具栏

顶部工具栏应包含：

- 应用标题，例如 Timeline Studio
- 搜索框
- 时间尺度切换：Day / Week / Month / Quarter / Year
- Today 按钮
- Fit all 按钮
- Zoom in 按钮
- Zoom out 按钮
- Add event 按钮
- View mode 切换：Compact / Lane
- Import / Export 按钮

按钮优先使用 lucide-react 图标。

## 4. 视觉设计要求

整体风格：现代、干净、专业、有一点高级感，但不要像营销落地页。

推荐设计方向：

- 背景：浅色模式为主，支持暗色模式更好
- 主背景：`#f7f8fb` 或类似柔和浅灰
- 时间轴区域：白色或微灰，不要大面积渐变
- 强调色：可以用蓝色、青色、橙色、红色组合，不要单一紫色主题
- 卡片圆角不超过 8px
- 时间轴网格线要细、克制
- 事件 marker 要有层次感，但不能太花
- 重要事件可用图标和颜色增强识别
- Hover/selected 状态必须清晰

不要做：

- 不要做 landing page
- 不要做大 hero 区
- 不要用装饰性渐变球、光斑
- 不要把所有东西都塞进大卡片
- 不要让文字溢出按钮或事件块
- 不要使用过度花哨的动画

## 5. 布局

推荐布局：

```text
┌─────────────────────────────────────────────────────────────┐
│ Top Toolbar: Search | Scale | Today | Fit | Zoom | Add      │
├─────────────────────────────────────────────────────────────┤
│ Filter Bar: Categories | Importance | Tags | View Mode      │
├───────────────┬─────────────────────────────────────────────┤
│ Optional      │                                             │
│ Left Lanes    │              Timeline Canvas                │
│ / Mini Map    │                                             │
├───────────────┴─────────────────────────────────────────────┤
│ Bottom Mini Overview / Time Range Slider                    │
└─────────────────────────────────────────────────────────────┘
```

右侧详情面板在选中事件时出现：

```text
┌──────────────────────────────┬──────────────────────────────┐
│                              │ Event Details Panel          │
│ Timeline                     │ title/date/tags/description  │
│                              │ Save/Delete                  │
└──────────────────────────────┴──────────────────────────────┘
```

## 6. 数据持久化

第一版可以用 localStorage 保存数据。

需要提供：

- 自动保存
- JSON 导出
- JSON 导入

导出格式示例：

```json
{
  "version": 1,
  "events": [
    {
      "id": "evt_001",
      "type": "point",
      "title": "Project kickoff",
      "date": "2026-07-09",
      "importance": "high",
      "category": "Work",
      "tags": ["planning"],
      "description": "Initial project kickoff."
    },
    {
      "id": "evt_002",
      "type": "range",
      "title": "Dataset preparation",
      "startDate": "2026-07-10",
      "endDate": "2026-07-20",
      "importance": "medium",
      "category": "Research",
      "tags": ["dataset", "preprocessing"],
      "description": "Download and preprocess dataset."
    }
  ],
  "categories": [
    {
      "id": "work",
      "name": "Work",
      "color": "#2563eb"
    }
  ]
}
```

## 7. 示例初始数据

应用首次打开时，如果 localStorage 为空，生成一些示例事件：

- Today: Project kickoff
- This week: Dataset download
- This month: Model baseline
- Next month: Paper draft
- Next quarter: Submission deadline

示例数据不要太多，8-12 个即可。

## 8. 交互细节

### 缩放

缩放时应以鼠标位置或视口中心为锚点，不要每次跳回时间轴起点。

### 平移

用户可以：

- 鼠标拖拽空白区域平移
- Shift + 鼠标滚轮横向滚动
- 底部 mini overview 拖动视窗

### Tooltip

Hover 事件时显示 tooltip：

- 标题
- 日期或时间范围
- 分类
- 重要性
- 简短描述

### 冲突/重叠

同一时间附近事件较多时：

- 自动错层显示
- 或在相同日期聚合成 +N badge
- 点击 badge 展开列表

### 键盘快捷键

支持：

- `N`：新建事件
- `Delete`：删除选中事件，需要确认
- `Esc`：关闭详情面板
- `Cmd/Ctrl + S`：保存
- `+` / `-`：缩放

## 9. 响应式要求

Desktop 是主要目标。

移动端最低要求：

- 能查看 timeline
- 能点击事件看详情
- 工具栏自动折叠
- 不要求复杂拖拽编辑完整可用

## 10. 可访问性

需要：

- 按钮有 aria-label
- 图标按钮有 tooltip
- 颜色不能作为唯一信息来源，重要性还要用图标/文本体现
- 键盘可操作基本功能

## 11. 文件结构建议

```text
src/
  app/
    App.tsx
  components/
    TimelineCanvas.tsx
    TimelineToolbar.tsx
    TimelineScaleControl.tsx
    EventDetailsPanel.tsx
    EventTooltip.tsx
    FilterBar.tsx
    MiniOverview.tsx
    CategoryLane.tsx
  data/
    sampleEvents.ts
  store/
    timelineStore.ts
  types/
    timeline.ts
  utils/
    dateScale.ts
    eventLayout.ts
    storage.ts
  styles/
    globals.css
```

## 12. 验收标准

完成后必须满足：

- 可以新增、编辑、删除事件
- 可以创建 point event 和 range event
- 可以在 Day / Week / Month / Quarter / Year 间切换
- 可以缩放和平移 timeline
- 可以搜索和筛选事件
- 可以拖拽事件改变时间
- 可以导入/导出 JSON
- 刷新页面后数据仍存在
- 界面美观、现代、无文字重叠
- 事件很多时布局不崩
- 桌面端体验流畅

## 13. 优先级

### P0 必须完成

- Timeline 展示
- 时间尺度切换
- 新增、编辑、删除事件
- localStorage 保存
- JSON 导入/导出
- 搜索
- 重要性标记
- 基础缩放和平移

### P1 应该完成

- Lane mode
- range event resize
- bottom mini overview
- tags/category filter
- keyboard shortcuts

### P2 可以后续做

- 暗色模式
- Markdown description preview
- 多文件工作区
- 云同步
- 协作编辑
- 图片/附件
- AI 自动整理时间线

## 14. 实现建议

如果使用 `vis-timeline`：

- 使用 `DataSet` 管理 items/groups
- `items` 映射事件
- `groups` 映射 category/lane
- 使用 `editable` 开启拖拽和调整
- 监听 `onMove`、`onMoving`、`onAdd`、`onUpdate`、`onRemove`
- 自定义 item template，让事件块更好看
- 外部工具栏控制 `setWindow()` 和 `fit()`

如果自研：

- 时间轴用 CSS grid 或 SVG 绘制刻度
- 用 date scale 函数把时间映射到 x 坐标
- 缩放改变 pixels-per-day
- 平移改变 viewport start/end
- 事件布局单独写 `eventLayout.ts`
- 拖拽时实时计算新日期并更新 store

## 15. 最终效果参考

目标不是普通甘特图，而是一个 Timeline Studio：

- 像 Notion/Linear 一样干净
- 像科研/项目管理工具一样实用
- 可以快速记录重点事件
- 可以优雅地缩放到不同时间尺度
- 能长期保存和管理个人/项目时间线

## 16. 推荐起步方案

建议第一版用 React + TypeScript + vis-timeline + shadcn/ui 起步。这样时间缩放、拖拽、range event 这些复杂交互不用从零实现，主要精力可以放在视觉质量、事件编辑体验和数据管理上。
