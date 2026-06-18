export default defineAppConfig({
  pages: [
    'pages/sessions/index',
    'pages/feedback/index',
    'pages/statistics/index',
    'pages/session-detail/index',
    'pages/heatmap-detail/index'
  ],
  window: {
    backgroundTextStyle: 'light',
    navigationBarBackgroundColor: '#1A1A24',
    navigationBarTitleText: '异常档案测试',
    navigationBarTextStyle: 'white',
    backgroundColor: '#0F0F14'
  },
  tabBar: {
    color: '#6B7280',
    selectedColor: '#A78BFA',
    backgroundColor: '#1A1A24',
    borderStyle: 'black',
    list: [
      {
        pagePath: 'pages/sessions/index',
        text: '测试场次'
      },
      {
        pagePath: 'pages/feedback/index',
        text: '玩家反馈'
      },
      {
        pagePath: 'pages/statistics/index',
        text: '结果汇总'
      }
    ]
  }
})
