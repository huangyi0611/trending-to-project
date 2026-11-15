/* ===== 公开版：在本页内存里拼提示词 =====
   只读你在表单里填的字，只写进本页的文本框。
   不发任何网络请求，不写任何浏览器存储，刷新即清空。 */
(function(){
  const $ = id => document.getElementById(id);
  const F = { name: $('cx-name'), summary: $('cx-summary'), stack: $('cx-stack'), goals: $('cx-goals') };
  if (!F.name) return;
  const status = $('cx-status');
  const clean = s => String(s || '').replace(/\r/g, '').trim();
  function cardText(c){
    return '### ' + c.name + '（GitHub：' + c.repo + '）\n' +
      '- 一句话：' + c.desc + '\n' +
      (c.can.length ? '- 它能做什么：\n' + c.can.map(x => '  - ' + x).join('\n') + '\n' : '') +
      (c.tags.length ? '- 常见方向：' + c.tags.join(' / ') + '\n' : '');
  }
  function fill(cards){
    const v = { name: clean(F.name.value) || '（未填写）', summary: clean(F.summary.value), stack: clean(F.stack.value) || '（未填写，请先问我）', goals: clean(F.goals.value) || '（未填写）' };
    return CONNECT_DATA.template
      .split('{{PROJECT_NAME}}').join(v.name)
      .split('{{PROJECT_SUMMARY}}').join(v.summary)
      .split('{{TECH_STACK}}').join(v.stack)
      .split('{{GOALS}}').join(v.goals)
      .split('{{ISSUE}}').join(CONNECT_DATA.issue)
      .split('{{CARDS}}').join(cards.map(cardText).join('\n'));
  }
  function setBox(box, text){
    const pre = box.querySelector('.prompt-text');
    pre.textContent = text;
    pre.hidden = !text;
    box.querySelectorAll('[data-copy],[data-expand]').forEach(b => { b.hidden = !text; });
    box.classList.toggle('ready', !!text);
    box.classList.remove('expanded');
  }
  $('cx-make').addEventListener('click', function(){
    if (!clean(F.summary.value)) { status.textContent = '先写一两句项目介绍'; F.summary.focus(); return; }
    CONNECT_DATA.cards.forEach(c => {
      const box = document.querySelector('[data-connect-for="' + c.id + '"]');
      if (box) setBox(box, fill([c]));
    });
    const all = $('cx-all'); all.hidden = false; setBox(all, fill(CONNECT_DATA.cards));
    status.textContent = '已生成：上方「整期一次生成」，以及每张卡末尾的「① 给你的项目用」。只在本页内存里。';
  });
  $('cx-clear').addEventListener('click', function(){
    Object.values(F).forEach(el => { el.value = ''; });
    document.querySelectorAll('[data-connect-for]').forEach(box => setBox(box, ''));
    const all = $('cx-all'); setBox(all, ''); all.hidden = true;
    status.textContent = '已清空';
  });
})();
