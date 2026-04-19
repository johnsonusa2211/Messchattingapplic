/* global React, ReactDOM */
// app.jsx — root

const { useState: useAppState, useEffect: useAppEffect } = React;

const TWEAK_DEFAULTS = /*EDITMODE-BEGIN*/{
  "groupName": "Weekend Crew 🌴",
  "subtitle": "Active now",
  "typingOn": true
}/*EDITMODE-END*/;

function makeMember(id, name, seed) {
  return { id, name, avatar: avatarUrl(seed) };
}

const initialMembers = [
  makeMember('u1', 'You', 'you-1983'),
  makeMember('u2', 'Maya', 'maya-seed-42'),
  makeMember('u3', 'Jordan', 'jordan-seed-7'),
  makeMember('u4', 'Priya', 'priya-seed-18'),
];

function initialMessages() {
  return [
    { id:'d1', type:'date', label:'Sat 6:24 PM' },
    { id:'m1', from:'u2', type:'text', text:'ok who\'s actually free this weekend 👀' },
    { id:'m2', from:'u3', type:'text', text:'me!! finally a free sat' },
    { id:'m3', from:'u3', type:'text', text:'what are we thinking — beach or hike?' },
    { id:'m4', from:'u4', type:'text', text:'beach beach beach', reactions:[{emoji:'❤️'},{emoji:'🙌'}] },
    { id:'m5', from:'u1', type:'text', text:'I\'m in. I can drive', seenBy:['u2','u3','u4'] },
    { id:'m6', from:'u2', type:'voice', duration:'0:23' },
    { id:'m7', from:'u2', type:'text', text:'^^ listen to that for the vibe', replyTo:{name:'Maya', text:'Voice message'} },
    { id:'m8', from:'u4', type:'image', src:'https://picsum.photos/seed/beach-day/400/300', reactions:[{emoji:'🔥'}] },
    { id:'m9', from:'u1', type:'text', text:'wait is that from last summer??' },
    { id:'m10', from:'u3', type:'text', text:'yeah pulled it up to convince everyone 😂' },
    { id:'c1', type:'call', missed:false, title:'Voice call', sub:'4 min 12 sec · with Maya, Jordan' },
    { id:'m11', from:'u1', type:'text', text:'ok sun chairs + speaker — I got it', seenBy:['u2','u3','u4'] },
  ];
}

function App() {
  const [state, setState] = useAppState(() => ({
    members: initialMembers,
    meId: 'u1',
    groupName: TWEAK_DEFAULTS.groupName,
    subtitle: TWEAK_DEFAULTS.subtitle,
    statusTime: '9:41',
    battery: 82,
    typingOn: TWEAK_DEFAULTS.typingOn,
    typingBy: 'u3',
    messages: initialMessages(),
  }));
  const [tweakMode, setTweakMode] = useAppState(false);

  useAppEffect(() => {
    const handler = (e) => {
      if (!e.data || typeof e.data !== 'object') return;
      if (e.data.type === '__activate_edit_mode') setTweakMode(true);
      if (e.data.type === '__deactivate_edit_mode') setTweakMode(false);
    };
    window.addEventListener('message', handler);
    window.parent.postMessage({ type:'__edit_mode_available' }, '*');
    return () => window.removeEventListener('message', handler);
  }, []);

  const pushTweak = (partial) => {
    window.parent.postMessage({ type:'__edit_mode_set_keys', edits: partial }, '*');
  };

  return (
    <>
      <div className="app-header">
        <div className="brand"><div className="logo-dot"/> Messenger Clone</div>
        <div className="tag">iPhone 16 Pro · iOS Messenger</div>
        <div className="spacer"/>
        <div style={{fontSize:12, color:'#65676b'}}>Tap the header name or subtitle to edit inline</div>
      </div>
      <div className="app-shell">
        <div className="phone-col">
          <MessengerPhone state={state} setState={setState} />
        </div>
        <div className="panel-col">
          <ControlPanel state={state} setState={setState} />
        </div>
      </div>

      {tweakMode && (
        <div style={{
          position:'fixed', right:20, bottom:20, width:280, background:'#fff',
          borderRadius:16, boxShadow:'0 10px 30px rgba(0,0,0,0.18)',
          padding:16, zIndex:2000, border:'1px solid #e4e6eb',
        }}>
          <div style={{fontSize:14, fontWeight:700, marginBottom:10}}>Tweaks</div>
          <div className="field">
            <label>Group name</label>
            <input type="text" value={state.groupName}
              onChange={e => { setState(s => ({...s, groupName:e.target.value})); pushTweak({ groupName:e.target.value }); }}/>
          </div>
          <div className="field" style={{marginTop:8}}>
            <label>Subtitle</label>
            <input type="text" value={state.subtitle}
              onChange={e => { setState(s => ({...s, subtitle:e.target.value})); pushTweak({ subtitle:e.target.value }); }}/>
          </div>
          <div style={{marginTop:10}}>
            <Toggle on={state.typingOn} label="Typing indicator"
              onChange={v => { setState(s => ({...s, typingOn:v})); pushTweak({ typingOn:v }); }} />
          </div>
        </div>
      )}
    </>
  );
}

ReactDOM.createRoot(document.getElementById('root')).render(<App/>);
