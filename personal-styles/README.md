# Personal styles · 个人风格库

Check these before upstream styles. Never overwrite an existing user film when updating a style.

Creative status: the user rejected the first seven rounds as poor work that missed the originals' essence. These starters preserve technical experiments, not an approved artistic standard. Read the [creative reset](../studio/research/creative-reset/README.zh-CN.md) before making a new film; develop a new story and prove its central visual idea before evolving a reusable style.

| English / 中文 | Slug | Base | Description |
|---|---|---|---|
| [Cloud & Ink / 云山墨序](cloud-ink/STYLE.md) | cloud-ink | ink-wash | Warm paper, five ink tones, restrained Chinese inscriptions and quiet nature |
| [Chinese Editorial / 中文编辑部](chinese-editorial/STYLE.md) | chinese-editorial | swiss-motion | Warm printed spreads, evidence columns and Chinese editorial rhythm |
| [Dark Product Studio / 深色科技与产品演示](dark-product/STYLE.md) | dark-product | dark-keynote | Chinese concept interface, ordered cards, pointer action and precise reveal |

All three styles can be created in the local studio or with `node studio/src/cli.ts create <slug> --style <style>`. Sources and score are copied into each project; updating a style never rewrites existing films. See the [reference comparison](../studio/comparison/REVIEW.zh-CN.md).

Original upstream style library: [Lemo-Opuscar](https://github.com/lemomo-ai/lemo-opuscar). Attribution and licensing stay in each style and in the repository LICENSE.
