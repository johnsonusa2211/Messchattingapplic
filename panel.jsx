/* global React */
// panel.jsx — Messenger-style control panel

const { useState: usePState } = React;

function Toggle({ on, onChange, label }) {
  return (
    <div className={`toggle ${on ? 'on' : ''}`} onClick={() => onChange(!on)}>
      <span className="knob"/>
      <span>{label}</span>
    </div>
  );
}

function Segmented({ options, value, onChange }) {
  return (
    <div className="segmented">
      {options.map(o => (
        <button key={o.value} className={value === o.value ? 'active' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

function MembersSection({ members, setMembers, meId, setMeId }) {
  const add = () => {
    const n = members.length + 1;
    const newM = {
      id: 'u' + Date.now(),
      name: `Member ${n}`,
      avatar: avatarUrl('new' + Date.now()),
    };
    setMembers([...members, newM]);
  };
  const remove = (id) => {
    if (members.length <= 2) return;
    setMembers(members.filter(m => m.id !== id));
    if (meId === id) setMeId(members[0].id);
  };
  const rename = (id, name) => setMembers(members.map(m => m.id === id ? {...m, name} : m));
  const changeAv = (id) => {
    const seed = 'av' + Date.now();
    setMembers(members.map(m => m.id === id ? {...m, avatar: avatarUrl(seed)} : m));
  };

  return (
    <section>
      <div className="row between">
        <div className="section-title" style={{margin:0}}>Group members</div>
        <button className="btn sm secondary" onClick={add}>+ Add</button>
      </div>
      <div className="mem-list">
        {members.map(m => (
          <div key={m.id} className="mem-chip">
            <div className="mem-av" style={{backgroundImage:`url(${m.avatar})`, cursor:'pointer'}} onClick={() => changeAv(m.id)} title="Click to randomize avatar" />
            <span className="mem-name" contentEditable suppressContentEditableWarning
              onBlur={e => rename(m.id, e.currentTarget.textContent)}>{m.name}</span>
            <span className="mem-x" onClick={() => remove(m.id)}>×</span>
          </div>
        ))}
      </div>
      <div className="field" style={{marginTop:8}}>
        <label>You are posting as</label>
        <select value={meId} onChange={e => setMeId(e.target.value)}>
          {members.map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
      </div>
    </section>
  );
}

function SendSection({ state, setState }) {
  const [text, setText] = usePState('');
  const send = (type = 'text', extra = {}) => {
    if (type === 'text' && !text.trim()) return;
    const msg = {
      id: 'm' + Date.now(),
      from: state.meId,
      type,
      text: type === 'text' ? text.trim() : undefined,
      time: state.statusTime,
      ...extra,
    };
    setState(s => ({...s, messages: [...s.messages, msg]}));
    setText('');
  };
  const me = state.members.find(m => m.id === state.meId);
  return (
    <section>
      <div className="section-title">Compose</div>
      <div className="message-compose-panel">
        <div className="who">
          <div className="who-av" style={{backgroundImage:`url(${me?.avatar})`}} />
          <span className="who-name">{me?.name}</span>
        </div>
        <div className="panel-compose">
          <input
            placeholder="Type a message…"
            value={text}
            onChange={e => setText(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter') send('text'); }}
          />
          <span className="pc-ic" title="Send image" onClick={() => send('image', { src: `https://picsum.photos/seed/${Date.now()}/400/300` })}>🖼️</span>
          <span className="pc-ic" title="Send sticker" onClick={() => send('sticker', { src: `https://api.dicebear.com/7.x/fun-emoji/svg?seed=${Date.now()}` })}>😀</span>
          <span className="pc-ic" title="Send voice" onClick={() => send('voice', { duration: '0:' + (10 + Math.floor(Math.random()*40)) })}>🎙️</span>
          <span className="pc-send" onClick={() => send('text')}>
            <svg width="20" height="20" viewBox="0 0 24 24" fill="#0084ff"><path d="M2.01 21 23 12 2.01 3 2 10l15 2-15 2z"/></svg>
          </span>
        </div>
      </div>
    </section>
  );
}

function AddExtrasSection({ state, setState }) {
  const addCall = (missed) => {
    const msg = { id:'c'+Date.now(), type:'call', missed, title: missed? 'Missed voice call' : 'Voice call', sub: missed ? 'You missed a call' : '2 min 34 sec' };
    setState(s => ({...s, messages:[...s.messages, msg]}));
  };
  const addDate = () => {
    const today = new Date();
    const label = today.toLocaleDateString('en-US', { weekday:'short', hour:'numeric', minute:'2-digit' });
    setState(s => ({...s, messages:[...s.messages, { id:'d'+Date.now(), type:'date', label }]}));
  };
  const addReaction = () => {
    const emojis = ['❤️','😂','👍','😮','😢','🔥'];
    const pick = emojis[Math.floor(Math.random()*emojis.length)];
    setState(s => {
      const msgs = [...s.messages];
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].type !== 'date' && msgs[i].type !== 'call') {
          msgs[i] = {...msgs[i], reactions: [...(msgs[i].reactions||[]), {emoji: pick}]};
          break;
        }
      }
      return {...s, messages: msgs};
    });
  };
  const addReply = () => {
    setState(s => {
      const lastReal = [...s.messages].reverse().find(m => m.type !== 'date' && m.type !== 'call');
      if (!lastReal) return s;
      const replyTo = {
        name: s.members.find(x => x.id === lastReal.from)?.name || 'Unknown',
        text: lastReal.text || (lastReal.type === 'image' ? 'Photo' : lastReal.type === 'sticker' ? 'Sticker' : lastReal.type === 'voice' ? 'Voice message' : ''),
      };
      return {...s, messages:[...s.messages, { id:'r'+Date.now(), from: s.meId, type:'text', text:'Totally agree 🙌', replyTo }]};
    });
  };
  const markSeen = () => {
    setState(s => {
      const msgs = [...s.messages];
      const others = s.members.filter(m => m.id !== s.meId).map(m => m.id).slice(0, 3);
      for (let i = msgs.length - 1; i >= 0; i--) {
        if (msgs[i].from === s.meId && msgs[i].type !== 'date' && msgs[i].type !== 'call') {
          msgs[i] = {...msgs[i], seenBy: others};
          break;
        }
      }
      return {...s, messages: msgs};
    });
  };
  const clearChat = () => setState(s => ({...s, messages: []}));
  const undo = () => setState(s => ({...s, messages: s.messages.slice(0, -1)}));

  return (
    <section>
      <div className="section-title">Add to chat</div>
      <div className="row">
        <button className="btn secondary sm" onClick={addReply}>↩︎ Reply</button>
        <button className="btn secondary sm" onClick={addReaction}>❤️ React</button>
        <button className="btn secondary sm" onClick={markSeen}>✓ Mark seen</button>
        <button className="btn secondary sm" onClick={() => addCall(false)}>📞 Call</button>
        <button className="btn secondary sm" onClick={() => addCall(true)}>☎️ Missed</button>
        <button className="btn secondary sm" onClick={addDate}>🗓 Date</button>
        <button className="btn ghost sm" onClick={undo}>Undo</button>
        <button className="btn ghost sm" onClick={clearChat} style={{color:'#e41e3f'}}>Clear</button>
      </div>
    </section>
  );
}

function SettingsSection({ state, setState }) {
  return (
    <section>
      <div className="section-title">Chat details</div>
      <div className="option-grid">
        <div className="field">
          <label>Group name</label>
          <input type="text" value={state.groupName} onChange={e => setState(s => ({...s, groupName: e.target.value}))} />
        </div>
        <div className="field">
          <label>Subtitle</label>
          <input type="text" value={state.subtitle} onChange={e => setState(s => ({...s, subtitle: e.target.value}))} />
        </div>
        <div className="field">
          <label>Status bar time</label>
          <input type="text" value={state.statusTime} onChange={e => setState(s => ({...s, statusTime: e.target.value}))} />
        </div>
        <div className="field">
          <label>Battery %</label>
          <input type="number" min="1" max="100" value={state.battery} onChange={e => setState(s => ({...s, battery: +e.target.value || 0}))} />
        </div>
      </div>
      <div className="row" style={{marginTop: 10}}>
        <Toggle on={state.typingOn} onChange={v => setState(s => ({...s, typingOn: v}))} label="Show typing indicator" />
        <div className="field" style={{marginLeft: 'auto'}}>
          <label style={{marginBottom:0}}>Who's typing</label>
          <select value={state.typingBy} onChange={e => setState(s => ({...s, typingBy: e.target.value}))}>
            {state.members.filter(m => m.id !== state.meId).map(m => <option key={m.id} value={m.id}>{m.name}</option>)}
          </select>
        </div>
      </div>
    </section>
  );
}

function ControlPanel({ state, setState }) {
  return (
    <div className="panel">
      <div>
        <h2>Messenger Group Chat</h2>
        <p className="panel-sub">Faithful iPhone 16 Pro · iOS Messenger (2026)</p>
      </div>
      <MembersSection
        members={state.members}
        setMembers={v => setState(s => ({...s, members: v}))}
        meId={state.meId}
        setMeId={v => setState(s => ({...s, meId: v}))}
      />
      <SendSection state={state} setState={setState} />
      <AddExtrasSection state={state} setState={setState} />
      <SettingsSection state={state} setState={setState} />
    </div>
  );
}

Object.assign(window, { ControlPanel });
