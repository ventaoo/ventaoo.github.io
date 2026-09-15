---
title: 用 Web Audio 合成 8-bit 音效
date: 2026-09-06
tags: [音频, Web Audio, 前端]
summary: 不用一个音频文件，全靠振荡器现场合成。点击有"哔"，升级有琶音，背景还在循环一段芯片音乐。
featured: true
---

这个站点的所有声音都是**现场算出来的**。没有 mp3，没有 wav，整个音频"资源"就是几十行代码。

老游戏机的音频芯片（比如 NES 的 2A03）只有几种声音：方波、三角波、噪声。Web Audio API 恰好能一一对应。

## 最小可用的一套声音

一个"哔"声只需要三样东西：振荡器、增益节点、和一段极短的包络。

`@js
private tone(freq, dur, wave = 'square', vol = 0.14) {
  const ctx = this.ensure();
  const t = ctx.currentTime;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = wave;                  // square / triangle / sawtooth
  osc.frequency.setValueAtTime(freq, t);

  gain.gain.setValueAtTime(vol, t);
  gain.gain.setValueAtTime(vol, t + dur * 0.82);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + dur);

  osc.connect(gain).connect(this.master);
  osc.start(t);
  osc.stop(t + dur + 0.02);
}
`@

这里最"复古"的一步是包络：**没有渐入**。音量瞬间拉满，保持 82% 的时长，然后急速衰减到几乎为零。

现代音效讲究 attack / decay / sustain / release 的平滑过渡；8-bit 音效恰恰相反 —— 硬起硬落，听起来才有颗粒感。

> `exponentialRampToValueAtTime` 的目标值不能是 0，会抛异常。写 `0.0001` 就行。

## 噪声：把一秒白噪声反复利用

鼓点和爆炸用的是同一段东西：一秒钟的随机采样。

`@js
const buf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
const data = buf.getChannelData(0);
for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
`@

创建一次，缓存起来，之后每个噪声音符都只是 `BufferSource` + 高通滤波器 + 一段包络：

`@js
private noise(dur, vol = 0.1, highpass = 1200) {
  const src = ctx.createBufferSource();
  src.buffer = this.noiseBuf;
  const filter = ctx.createBiquadFilter();
  filter.type = 'highpass';
  filter.frequency.value = highpass;
  // ...
}
`@

高通截止频率决定它是"沙锤"（3000Hz 以上）还是"底鼓"（1200Hz 左右）。

## 让频率滑起来

一个固定频率是"哔"，一个滑动的频率是"咻"。区别只在 `exponentialRampToValueAtTime`：

`@js
osc.frequency.setValueAtTime(220, t);
osc.frequency.exponentialRampToValueAtTime(1400, t + 0.5);
`@

页面切换用的是这个 —— 一段从 220Hz 冲到 1400Hz 的"传送"声。用**指数**而不是线性插值很重要：人耳对频率的感知是对数的，线性滑音听起来会前快后慢。

## 背景音乐：一个五行的音序器

芯片音乐不需要复杂的作曲，一段循环的和弦进行就够了。我用的是 Am – F – C – G，写成低音数组：

`@js
private static readonly BASS = [110, 110, 146.8, 146.8, 87.3, 87.3, 130.8, 130.8];
private static readonly ARP  = [440, 523, 659, 523, 587, 698, 880, 698,
                                349, 440, 523, 440, 523, 659, 784, 659];
`@

然后 `setInterval` 每 150ms 走一步：

`@js
private tickSeq() {
  const s = this.step;
  this.tone(Chip.BASS[s % 8], 0.16, 'triangle', 0.22, this.musicGain); // 低音
  this.tone(Chip.ARP[s % 16], 0.09, 'square', 0.075, this.musicGain);  // 琶音
  if (s % 4 === 2) this.noise(0.05, 0.05, 3000, this.musicGain);       // 踩镲
  if (s % 8 === 0) this.noise(0.11, 0.07, 1200, this.musicGain);       // 底鼓
  this.step = (s + 1) % 64;
}
`@

方波走旋律，三角波走低音，噪声走节奏 —— 三种波形分工明确，这就是 8-bit 配器的全部。

> 严格来说 `setInterval` 不是精确的调度器，长时间播放会有漂移。正经做法是用 `AudioContext.currentTime` 做前瞻调度（lookahead scheduling）。但对一段氛围循环来说，几毫秒的抖动反而更像老卡带的质感。

## 浏览器的自动播放策略

有一件事必须处理：**浏览器不允许在用户交互之前播放声音**。`AudioContext` 会创建在 `suspended` 状态。

所以音频图要**懒初始化**，并且提供一个解锁点：

`@js
unlock() {
  const ctx = this.ensure();
  if (ctx && ctx.state === 'suspended') ctx.resume();
}
`@

我在首次点击、首次按键时都会调一次 `unlock()`。另外音效默认**开着**但音量很小，背景音乐默认**关着** —— 不请自来的音乐会让人立刻关掉标签页。

## 音量分层

所有声音先汇进 `master`，音乐再单独走一层 `musicGain`：

`@js
master.gain.value = 0.5;
music.gain.value = 0.16;   // 音乐比音效轻得多
music.connect(master);
`@

这样一个 `master` 就能静音全部，而音乐永远不会盖过交互反馈 —— 反馈音是给人"确认操作成功"的，被盖住就失去意义了。

---

加起来不到两百行，换来了整个站点的听觉人格。而且加载体积是 **0 字节**。
