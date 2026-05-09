# A 钱器

旅行多人账目计算网页。支持登录查看、按人切换账目卡片、应收/应付明细、双方抵消后的付款汇总。

## 账号

用户：

- 大鸟
- 司徒
- alex
- 老鹰
- 梧桐
- 皮老弟
- JC
- 秋旋
- 叶婷
- 毛老师

统一密码：

```text
yyds8888
```

## 权限

- 所有人都可以登录查看。
- 只有梧桐可以新增或删除明细。

## GitHub Pages 部署

上传到 GitHub 仓库时，只需要上传这些文件：

- `index.html`
- `styles.css`
- `app.js`
- `README.md`
- `.gitignore`

不要上传：

- `ngrok`
- `ngrok.zip`

部署步骤：

1. 在 GitHub 新建仓库，例如 `a-money`。
2. 把本目录文件上传到仓库根目录。
3. 打开仓库 `Settings`。
4. 进入 `Pages`。
5. `Source` 选择 `Deploy from a branch`。
6. `Branch` 选择 `main`，目录选择 `/root`。
7. 保存后等待 GitHub 生成地址。

最终地址通常类似：

```text
https://你的GitHub用户名.github.io/a-money/
```

## 注意

这是纯前端静态网页。密码和账单数据都写在前端代码里，适合朋友之间临时查看，不适合存放高敏感数据。
