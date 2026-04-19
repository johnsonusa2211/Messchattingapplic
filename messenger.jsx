/* global React */
// messenger.jsx — iPhone 16 Pro Messenger group chat UI

const { useState, useEffect, useMemo, useRef } = React;

// --- helpers ---
const PhBack = () => (
  <svg width="14" height="22" viewBox="0 0 14 22" fill="none">
    <path d="M12 2 3 11l9 9" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
const PhPhone = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
    <path d="M20.01 15.38a11.87 11.87 0 0 1-3.72-.59 1.03 1.03 0 0 0-1.06.24l-1.57 1.97a15.02 15.02 0 0 1-6.59-6.58l1.96-1.66a1 1 0 0 0 .25-1.02A11.87 11.87 0 0 1 8.69 4 1 1 0 0 0 7.69 3H4.19A.99.99 0 0 0 3.19 4.04C3.56 14.26 11.74 22.44 21.96 22.81a.99.99 0 0 0 1.04-1V18.4c0-.55-.45-.99-.99-1.02z" fill="#0084ff"/>
  </svg>
);
const PhVideo = () => (
  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
    <path d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z" fill="#0084ff"/>
  </svg>
);
const PhPlus = () => <svg width="26" height="26" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10" fill="#0084ff"/><path d="M12 8v8M8 12h8" stroke="#fff" strokeWidth="2" strokeLinecap="round"/></svg>;
const PhCamera = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#0084ff"><path d="M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7zM20 4h-3.2L15 2H9L7.2 4H4a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2V6a2 2 0 0 0-2-2zm-8 14a6 6 0 1 1 0-12 6 6 0 0 1 0 12z"/></svg>;
const PhPhoto = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#0084ff"><path d="M21 19V5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2zM8.5 13.5l2.5 3L14.5 12l4.5 6H5l3.5-4.5z"/></svg>;
const PhMic = () => <svg width="24" height="24" viewBox="0 0 24 24" fill="#0084ff"><path d="M12 14a3 3 0 0 0 3-3V5a3 3 0 0 0-6 0v6a3 3 0 0 0 3 3zm5.3-3c0 3-2.54 5.1-5.3 5.1S6.7 14 6.7 11H5c0 3.42 2.72 6.23 6 6.72V21h2v-3.28c3.28-.48 6-3.3 6-6.72h-1.7z"/></svg>;
const PhSmile = () => <svg width="22" height="22" viewBox="0 0 24 24" fill="#0084ff"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm-3.5 7a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm7 0a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zM12 17.5a5.5 5.5 0 0 1-4.9-3h9.8a5.5 5.5 0 0 1-4.9 3z"/></svg>;
const PhThumb = () => <svg width="26" height="26" viewBox="0 0 24 24" fill="#0084ff"><path d="M1 21h4V9H1v12zm22-11a2 2 0 0 0-2-2h-6.31l.95-4.57.03-.32a1.5 1.5 0 0 0-.44-1.06L14.17 1 7.59 7.59A1.99 1.99 0 0 0 7 9v10a2 2 0 0 0 2 2h9a2 2 0 0 0 1.84-1.22l3.02-7.05c.09-.23.14-.47.14-.73v-2z"/></svg>;
const PhPlay = () => <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor"><path d="M8 5v14l11-7z"/></svg>;
const PhPhoneSm = ({missed}) => <svg width="18" height="18" viewBox="0 0 24 24" fill={missed?"#e41e3f":"#65676b"}><path d="M20.01 15.38a11.87 11.87 0 0 1-3.72-.59 1.03 1.03 0 0 0-1.06.24l-1.57 1.97a15.02 15.02 0 0 1-6.59-6.58l1.96-1.66a1 1 0 0 0 .25-1.02A11.87 11.87 0 0 1 8.69 4 1 1 0 0 0 7.69 3H4.19A.99.99 0 0 0 3.19 4.04C3.56 14.26 11.74 22.44 21.96 22.81a.99.99 0 0 0 1.04-1V18.4c0-.55-.45-.99-.99-1.02z"/></svg>;

// Avatar url (placeholder-service that generates consistent avatars)
function avatarUrl(seed) {
  return `https://i.pravatar.cc/150?img=${(Math.abs(hashCode(seed)) % 70) + 1}`;
}
function hashCode(s) {
  let h = 0; for (let i = 0; i < s.length; i++) { h = (h << 5) - h + s.charCodeAt(i); h |= 0; }
  return h;
}

// Status bar
function IPhoneStatusBar({ time, battery = 82 }) {
  return (
    <div className="ios-statusbar">
      <div className="ios-time">{time}</div>
      <div style={{flex: 1}} />
      <div className="ios-right">
        {/* signal */}
        <svg width="17" height="11" viewBox="0 0 18 10"><rect x="0" y="6" width="3" height="4" rx="1" fill="#000"/><rect x="4" y="4" width="3" height="6" rx="1" fill="#000"/><rect x="8" y="2" width="3" height="8" rx="1" fill="#000"/><rect x="12" y="0" width="3" height="10" rx="1" fill="#000"/></svg>
        {/* wifi */}
        <svg width="15" height="11" viewBox="0 0 16 12" style={{marginLeft:5}}><path d="M8 11.5a1.25 1.25 0 1 0 0-2.5 1.25 1.25 0 0 0 0 2.5zM12.1 6.9a5.8 5.8 0 0 0-8.2 0l1.3 1.3a4 4 0 0 1 5.6 0l1.3-1.3zM15 4a10 10 0 0 0-14 0l1.3 1.3a8.1 8.1 0 0 1 11.4 0L15 4z" fill="#000"/></svg>
        <span className="ios-battery-shell" style={{marginLeft:5}}>
          <span className="ios-battery-fill" style={{width: `${battery}%`}} />
        </span>
      </div>
    </div>
  );
}

// Header
function MessengerHeader({ groupName, subtitle, members, onNameChange, onSubChange }) {
  const av1 = members[0]?.avatar || avatarUrl('a');
  const av2 = members[1]?.avatar || avatarUrl('b');
  const single = members.length < 2;
  return (
    <div className="msg-header">
      <div className="back"><PhBack/></div>
      <div className={`avatar-stack ${single ? 'single' : ''}`}>
        <div className="av a1" style={{backgroundImage: `url(${av1})`}} />
        <div className="av a2" style={{backgroundImage: `url(${av2})`}} />
      </div>
      <div className="title-wrap">
        <span className="title" contentEditable suppressContentEditableWarning
          onBlur={e => onNameChange(e.currentTarget.textContent)}>{groupName}</span>
        <span className="subtitle" contentEditable suppressContentEditableWarning
          onBlur={e => onSubChange(e.currentTarget.textContent)}>{subtitle}</span>
      </div>
      <div className="action"><PhPhone/></div>
      <div className="action"><PhVideo/></div>
    </div>
  );
}

// Voice waveform
function VoiceWave({ bars = 28, sent }) {
  const heights = useMemo(() => Array.from({length: bars}, (_, i) => {
    const t = i / bars;
    const base = 6 + Math.sin(t * Math.PI * 3) * 5 + Math.cos(t * Math.PI * 7) * 3;
    return Math.max(4, Math.min(18, base + (i % 4) * 1.5));
  }), [bars]);
  return (
    <div className="voice-wave">
      {heights.map((h, i) => <span key={i} style={{height: h}} />)}
    </div>
  );
}

// Bubble content per type
function BubbleBody({ msg, sent }) {
  if (msg.type === 'image') {
    return <div className="bubble image"><img src={msg.src} alt="" /></div>;
  }
  if (msg.type === 'sticker') {
    return <div className="bubble sticker"><img src={msg.src} alt="" /></div>;
  }
  if (msg.type === 'voice') {
    return (
      <div className={`bubble voice ${msg.pos || 'solo'}`}>
        <div className="voice-inner">
          <div className="voice-play"><PhPlay/></div>
          <VoiceWave sent={sent} />
          <span className="voice-duration">{msg.duration || '0:14'}</span>
        </div>
      </div>
    );
  }
  return <div className={`bubble ${msg.pos || 'solo'}`}>{msg.text}</div>;
}

// Single message row
function MessageRow({ msg, sent, showAvatar, showName, senderName, senderAvatar }) {
  const pos = msg.pos || 'solo';
  const cls = `msg-row ${sent ? 'sent' : 'received'} ${pos === 'first' || pos === 'solo' ? 'first' : ''}`;
  return (
    <>
      {showName && !sent && <div className="sender-name">{senderName}</div>}
      <div className={cls}>
        {!sent && (
          <div className={`av-slot ${showAvatar ? '' : 'hidden'}`}>
            <div className="av" style={{backgroundImage: `url(${senderAvatar})`}} />
          </div>
        )}
        <div className="stack">
          {msg.replyTo && (
            <div className="reply-context">
              <div className="reply-to">{msg.replyTo.name}</div>
              <div className="reply-text">{msg.replyTo.text}</div>
            </div>
          )}
          <BubbleBody msg={msg} sent={sent} />
          {msg.reactions && msg.reactions.length > 0 && (
            <div className="reactions">
              {msg.reactions.map((r, i) => <span key={i}>{r.emoji}</span>)}
              {msg.reactions.length > 1 && <span className="count">{msg.reactions.length}</span>}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

// Date divider
function DateSep({ label }) {
  return <div className="date-sep"><span>{label}</span></div>;
}

// Call bubble
function CallBubble({ missed, title, sub }) {
  return (
    <div className="call-wrap">
      <div className={`call-bubble ${missed ? 'missed' : ''}`}>
        <div className="call-ic"><PhPhoneSm missed={missed}/></div>
        <div className="call-txt">
          <div className="call-title">{title}</div>
          <div className="call-sub">{sub}</div>
        </div>
      </div>
    </div>
  );
}

// Typing indicator
function TypingIndicator({ avatar }) {
  return (
    <div className="msg-row received first" style={{marginTop: 8}}>
      <div className="av-slot">
        <div className="av" style={{backgroundImage: `url(${avatar})`}} />
      </div>
      <div className="stack">
        <div className="typing-bubble">
          <span className="dot"/><span className="dot"/><span className="dot"/>
        </div>
      </div>
    </div>
  );
}

// Conversation
function Conversation({ messages, members, meId, showTyping, typingBy, groupName }) {
  const memberById = Object.fromEntries(members.map(m => [m.id, m]));
  const scrollRef = useRef(null);
  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, showTyping]);

  // compute pos (first/middle/last/solo) based on same-sender adjacency
  const rows = useMemo(() => {
    const out = [];
    for (let i = 0; i < messages.length; i++) {
      const m = messages[i];
      if (m.type === 'date' || m.type === 'call') { out.push({...m, kind: m.type}); continue; }
      const prev = messages[i-1];
      const next = messages[i+1];
      const sameAsPrev = prev && prev.from === m.from && prev.type !== 'date' && prev.type !== 'call' && m.type !== 'image' && m.type !== 'sticker' && prev.type !== 'image' && prev.type !== 'sticker';
      const sameAsNext = next && next.from === m.from && next.type !== 'date' && next.type !== 'call' && m.type !== 'image' && m.type !== 'sticker' && next.type !== 'image' && next.type !== 'sticker';
      let pos = 'solo';
      if (sameAsPrev && sameAsNext) pos = 'middle';
      else if (sameAsPrev) pos = 'last';
      else if (sameAsNext) pos = 'first';
      out.push({...m, pos, showAvatar: !sameAsNext, showName: !sameAsPrev && m.from !== meId});
    }
    return out;
  }, [messages, meId]);

  return (
    <div className="conversation" ref={scrollRef}>
      <div className="chat-intro">
        <div className="intro-avatars">
          <div className="av a1" style={{backgroundImage: `url(${members[0]?.avatar})`}} />
          <div className="av a2" style={{backgroundImage: `url(${members[1]?.avatar})`}} />
        </div>
        <div className="intro-name">{groupName}</div>
        <div className="intro-sub">Messenger · {members.length} members</div>
        <div className="intro-btn">View group</div>
      </div>

      {rows.map((r, i) => {
        if (r.kind === 'date') return <DateSep key={i} label={r.label} />;
        if (r.kind === 'call') return <CallBubble key={i} missed={r.missed} title={r.title} sub={r.sub} />;
        const sent = r.from === meId;
        const sender = memberById[r.from];
        return (
          <React.Fragment key={i}>
            <MessageRow
              msg={r}
              sent={sent}
              showAvatar={r.showAvatar}
              showName={r.showName && members.length > 2}
              senderName={sender?.name}
              senderAvatar={sender?.avatar}
            />
            {r.seenBy && r.seenBy.length > 0 && (
              <div className="seen-row">
                {r.seenBy.slice(0, 3).map((uid, idx) => (
                  <div key={idx} className="seen-av" style={{backgroundImage: `url(${memberById[uid]?.avatar})`}} />
                ))}
              </div>
            )}
            {r.delivered && sent && !r.seenBy && (
              <div className="seen-row">
                <span className="seen-check hollow">✓</span>
                <span>Delivered</span>
              </div>
            )}
          </React.Fragment>
        );
      })}

      {showTyping && <TypingIndicator avatar={memberById[typingBy]?.avatar} />}
    </div>
  );
}

// Compose bar
function ComposeBar() {
  return (
    <div className="compose">
      <div className="c-ic"><PhPlus/></div>
      <div className="c-ic"><PhCamera/></div>
      <div className="c-ic"><PhPhoto/></div>
      <div className="c-ic"><PhMic/></div>
      <div className="c-input">
        <span className="fake-text">Aa</span>
        <span className="c-emoji"><PhSmile/></span>
      </div>
      <div className="c-like"><PhThumb/></div>
    </div>
  );
}

// Full phone
function MessengerPhone({ state, setState }) {
  return (
    <div className="iphone16">
      <div className="side-btn silent"/>
      <div className="side-btn vol-up"/>
      <div className="side-btn vol-down"/>
      <div className="side-btn power"/>
      <div className="dynamic-island"/>
      <div className="screen">
        <div className="screen-inner">
          <IPhoneStatusBar time={state.statusTime} battery={state.battery} />
          <MessengerHeader
            groupName={state.groupName}
            subtitle={state.subtitle}
            members={state.members}
            onNameChange={v => setState(s => ({...s, groupName: v}))}
            onSubChange={v => setState(s => ({...s, subtitle: v}))}
          />
          <Conversation
            messages={state.messages}
            members={state.members}
            meId={state.meId}
            showTyping={state.typingOn}
            typingBy={state.typingBy}
            groupName={state.groupName}
          />
          <ComposeBar />
          <div className="home-indicator" />
        </div>
      </div>
    </div>
  );
}

Object.assign(window, { MessengerPhone, avatarUrl });
