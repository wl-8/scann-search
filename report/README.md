# SCANN-SEARCH 结项报告

本目录存放软件工程大作业的 LaTeX 结项报告。

## 文件说明

- `final_report.tex`：最终项目报告主文件，内容参考 `slide/团队作业.pptx`、`slide/软件工程_scann-search_PPT(1).pptx`、项目 README、开发文档和当前源码实现整理。
- `final_report.pdf`：已编译好的最终报告 PDF，可直接用于预览和提交前检查。

## 编译方式

建议使用 XeLaTeX 编译中文报告：

```bash
cd report
xelatex final_report.tex
xelatex final_report.tex
```

如果安装了 `latexmk`，也可以执行：

```bash
cd report
latexmk -xelatex final_report.tex
```

报告中的参与人员表基于 Git 提交作者记录整理；正式提交前可将 Git 用户名替换为课程要求的姓名、学号和贡献度。
