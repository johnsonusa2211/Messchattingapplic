/* ===========================================================
 *  Facebook Messenger Group Chat – Template Engine
 *  Unlimited users, dropdown sender selector, full parity
 *  with Viber template (text, image, sticker, voice, calls,
 *  date separators, screenshot, PouchDB persistence).
 * =========================================================== */

/* ------------ State ------------ */
var DEFAULT_AVATARS = [
  'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#0084ff"/><text x="50%" y="55%" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="700" font-size="18">M</text></svg>'),
  'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#6a3cff"/><text x="50%" y="55%" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="700" font-size="18">A</text></svg>'),
  'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#e4446c"/><text x="50%" y="55%" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="700" font-size="18">B</text></svg>'),
  'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#35a76b"/><text x="50%" y="55%" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="700" font-size="18">C</text></svg>'),
  'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#f58320"/><text x="50%" y="55%" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="700" font-size="18">D</text></svg>'),
  'data:image/svg+xml;utf8,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 40"><rect width="40" height="40" rx="20" fill="#7b61ff"/><text x="50%" y="55%" text-anchor="middle" fill="#fff" font-family="Arial" font-weight="700" font-size="18">E</text></svg>')
];

var users = [
  { id: 'me',      name: 'Me',     avatar: DEFAULT_AVATARS[0], role: 'me' },
  { id: 'user_2',  name: 'Alex',   avatar: DEFAULT_AVATARS[1], role: 'them' }
];
var activeUserId = 'me';

/* General state */
var currentChatRoomDb = null;
var currentChatRoomId = null;
var isSeen = true;
var callStatusDone = true;
var isStopInterval = false;
var timeIntervalID = null;
var total_latest_second = 0;
var lastUser = null;           // last sender id (or 'new_day', 'call')
var lastMsgType = null;
var voiceDuration = 0;
var latestGenMinute = 0;
var maxVoiceMinute = 2;
var maxCallMinute = 15;
var time_format = 'PM';
var inp_time_format = 'PM';
var noOfVoiceFile = 57;
var noOfVoiceMisscall = 0;
var seleted_date_msg = [];
var thisDay = new Date();
var addingUserTarget = null;   // which user is editing avatar

/* ------------ DOM helpers ------------ */
function $id(id) { return document.getElementById(id); }
function el(tag, cls) { var e = document.createElement(tag); if (cls) e.className = cls; return e; }
function zeroPad(n, w) { n = String(n); return n.length >= w ? n : new Array(w - n.length + 1).join('0') + n; }
function uid() { return 'u_' + Date.now() + '_' + Math.floor(Math.random() * 10000); }

/* ------------ Time ticker ------------ */
var deviceTime = document.querySelector('.status-bar .time');
deviceTime.innerHTML = moment().format('h:mm');
time_format = moment().format('A');
inp_time_format = time_format;
if (time_format === 'AM') { $id('clock-am').checked = true; } else { $id('clock-pm').checked = true; }

function startTimeInterval() {
  timeIntervalID = setInterval(function () { deviceTime.innerHTML = moment().format('h:mm'); }, 10 * 1000);
}
function stopTimeInterval() { isStopInterval = true; clearInterval(timeIntervalID); }
startTimeInterval();

function stringTimeToSecond(t) {
  var parts = t.split(' ');
  var hm = parts[0].split(':');
  var h = parseInt(hm[0], 10);
  var m = parseInt(hm[1], 10);
  if (parts[1] === 'PM' && h !== 12) h += 12;
  if (parts[1] === 'AM' && h === 12) h = 0;
  return (h * 3600) + (m * 60);
}
function secondsToClock(totalSec) {
  totalSec = totalSec % (24 * 3600);
  var h24 = Math.floor(totalSec / 3600);
  var m = Math.floor((totalSec % 3600) / 60);
  var fmt = h24 >= 12 ? 'PM' : 'AM';
  var h = h24 % 12; if (h === 0) h = 12;
  return { h: h, m: m, fmt: fmt, str: h + ':' + zeroPad(m, 2) + ' ' + fmt };
}
function secondsToMinute(m) {
  var s = Math.floor(Math.random() * 60);
  var mm = Math.floor(Math.random() * m);
  return zeroPad(mm, 2) + ':' + zeroPad(s, 2);
}
function startCustomTimeInterval() {
  clearInterval(timeIntervalID);
  timeIntervalID = setInterval(function () {
    total_latest_second += 60;
    var c = secondsToClock(total_latest_second);
    deviceTime.innerHTML = c.h + ':' + zeroPad(c.m, 2);
    time_format = c.fmt;
  }, 60 * 1000);
}

function currentMessageTime() {
  if (total_latest_second > 0) {
    var c = secondsToClock(total_latest_second);
    return c.str;
  }
  return moment().format('h:mm A');
}

/* ------------ Conversation container ------------ */
var conversation = document.querySelector('.conversation-container');

/* ------------ User Management ------------ */
function findUser(id) { for (var i = 0; i < users.length; i++) if (users[i].id === id) return users[i]; return null; }

function renderMembersList() {
  var list = $id('members_list');
  list.innerHTML = '';
  users.forEach(function (u) {
    var card = el('div', 'member-card');
    card.dataset.userId = u.id;

    var avatar = el('div', 'member-avatar');
    avatar.style.backgroundImage = "url('" + u.avatar + "')";
    avatar.title = 'Click to change avatar';
    avatar.onclick = function () { triggerAvatarChange(u.id); };

    var name = el('span', 'member-name');
    name.contentEditable = 'true';
    name.textContent = u.name;
    name.addEventListener('blur', function () {
      u.name = name.textContent.trim() || u.name;
      renderActiveUserSelect();
      reRenderConversation();
    });

    var roleBadge = el('span');
    roleBadge.style.fontSize = '10px';
    roleBadge.style.marginLeft = '4px';
    roleBadge.style.padding = '2px 6px';
    roleBadge.style.borderRadius = '10px';
    roleBadge.style.background = u.role === 'me' ? '#0084ff' : '#d1d3d7';
    roleBadge.style.color = u.role === 'me' ? '#fff' : '#333';
    roleBadge.style.cursor = 'pointer';
    roleBadge.textContent = u.role === 'me' ? 'me' : 'them';
    roleBadge.title = 'Toggle role (me = right side, them = left side)';
    roleBadge.onclick = function () {
      u.role = u.role === 'me' ? 'them' : 'me';
      renderMembersList();
      reRenderConversation();
    };

    var rm = el('span', 'member-remove');
    rm.innerHTML = '<span class="material-icons" style="font-size:18px;">close</span>';
    rm.title = 'Remove member';
    rm.onclick = function () {
      if (users.length <= 1) { alert('At least 1 member required.'); return; }
      users = users.filter(function (x) { return x.id !== u.id; });
      if (activeUserId === u.id) activeUserId = users[0].id;
      renderAll();
    };

    card.appendChild(avatar);
    card.appendChild(name);
    card.appendChild(roleBadge);
    card.appendChild(rm);
    list.appendChild(card);
  });
}

function renderActiveUserSelect() {
  var sel = $id('active_user_select');
  var prev = activeUserId;
  sel.innerHTML = '';
  users.forEach(function (u) {
    var opt = document.createElement('option');
    opt.value = u.id;
    opt.textContent = u.name + (u.role === 'me' ? ' (me)' : '');
    sel.appendChild(opt);
  });
  if (!findUser(prev)) prev = users[0].id;
  sel.value = prev;
  activeUserId = prev;
}

function renderGroupAvatarStack() {
  var stack = $id('group-avatar-stack');
  stack.innerHTML = '';
  var them = users.filter(function (u) { return u.role !== 'me'; });
  if (them.length === 0) them = users.slice(0);
  stack.classList.toggle('single', them.length === 1);
  them.slice(0, 2).forEach(function (u) {
    var a = el('div', 'avatar-mini');
    a.style.backgroundImage = "url('" + u.avatar + "')";
    stack.appendChild(a);
  });
}

function triggerAvatarChange(userId) {
  addingUserTarget = userId;
  var inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = 'image/*';
  inp.onchange = function (e) {
    var f = e.target.files && e.target.files[0];
    if (!f) return;
    var r = new FileReader();
    r.onload = function (ev) {
      var u = findUser(userId);
      if (u) { u.avatar = ev.target.result; renderAll(); reRenderConversation(); }
    };
    r.readAsDataURL(f);
  };
  inp.click();
}

function renderAll() {
  renderMembersList();
  renderActiveUserSelect();
  renderGroupAvatarStack();
}

/* Add User button */
$id('add_user_btn').addEventListener('click', function () {
  var id = uid();
  var newUser = {
    id: id,
    name: 'User ' + (users.length + 1),
    avatar: DEFAULT_AVATARS[users.length % DEFAULT_AVATARS.length],
    role: 'them'
  };
  users.push(newUser);
  renderAll();
});

/* Dropdown change */
$id('active_user_select').addEventListener('change', function (e) {
  activeUserId = e.target.value;
  var u = findUser(activeUserId);
  $id('input_text_active').placeholder = u ? 'Send as ' + u.name + '...' : 'Type a message...';
});

/* ------------ Group header name / status ------------ */
$id('chat_name').addEventListener('blur', function () {
  // name persists in DOM
});

/* ------------ Message building ------------ */
function ensureLastClassReset(newSender, newType) {
  // Only remove .last when the new message continues the SAME burst,
  // so previous burst's final bubble keeps its tail corner.
  if (newType === 'new_day' || newType === 'voice_call' || newType === 'video_call') return;
  if (lastUser !== newSender) return;
  if (lastMsgType === 'new_day' || lastMsgType === 'voice_call' || lastMsgType === 'video_call') return;
  var last = conversation.querySelector('.msg_root:last-child');
  if (!last) return;
  var msg = last.querySelector('.message');
  if (msg) msg.classList.remove('last');
}

function buildMessageDom(opts) {
  /* opts = { type, text, sender (userId or 'new_day'), data (file dataUrl), call:{title, arrow} } */
  var type = opts.type;
  var sender = opts.sender;
  var root = el('div');
  root.classList.add('msg_root');

  if (type === 'new_day') {
    var wrap = el('div', 'message_wrapper new_day');
    var newDayDiv = el('div', 'current_new_day');
    newDayDiv.innerHTML = '<span class="time" contentEditable="true">' + opts.text + '</span>';
    wrap.appendChild(newDayDiv);
    root.appendChild(wrap);
    root.__msg_type = 'new_day';
    root.__sender = 'new_day';
    return root;
  }

  var user = findUser(sender);
  if (!user) user = users[0];
  var isMe = user.role === 'me';

  if (type === 'voice_call' || type === 'video_call') {
    // Centered call bubble
    var callWrap = el('div', 'message_wrapper call_wrapper');
    callWrap.classList.add(isMe ? 'sent' : 'received');
    var miss = !callStatusDone;
    var callMsg = el('div', 'message voice_call' + (miss ? ' miss_call' : ''));
    callMsg.dataset.callKind = type;

    var titleText = (type === 'video_call' ? 'Video call' : 'Voice call');
    var durText = miss ? '00:00' : secondsToMinute(maxCallMinute);
    var icon = (type === 'video_call')
      ? '<svg viewBox="0 0 24 24" width="20" height="20"><path fill="' + (miss ? '#e41e3f' : '#0084ff') + '" d="M17 10.5V7a1 1 0 0 0-1-1H4a1 1 0 0 0-1 1v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1v-3.5l4 4v-11l-4 4z"/></svg>'
      : '<svg viewBox="0 0 24 24" width="18" height="18"><path fill="' + (miss ? '#e41e3f' : '#0084ff') + '" d="M20.01 15.38a11.87 11.87 0 0 1-3.72-.59 1.03 1.03 0 0 0-1.06.24l-1.57 1.97a15.02 15.02 0 0 1-6.59-6.58l1.96-1.66a1 1 0 0 0 .25-1.02A11.87 11.87 0 0 1 8.69 4 1 1 0 0 0 7.69 3H4.19A.99.99 0 0 0 3.19 4.04C3.56 14.26 11.74 22.44 21.96 22.81a.99.99 0 0 0 1.04-1V18.4c0-.55-.45-.99-.99-1.02z"/></svg>';

    callMsg.innerHTML =
      '<div class="call-ic">' + icon + '</div>' +
      '<div class="voice_content">' +
        '<span class="title" contentEditable="true">' + (miss ? 'Missed ' + titleText.toLowerCase() : titleText) + ' · ' + durText + '</span>' +
        '<span class="content_time" contentEditable="true">' + currentMessageTime() + '</span>' +
      '</div>';
    appendDeleteHover(callMsg);
    callWrap.appendChild(callMsg);
    root.appendChild(callWrap);
    root.__msg_type = type;
    root.__sender = sender;
    return root;
  }

  /* ----- Regular message wrapper ----- */
  var wrapper = el('div', 'message_wrapper');
  wrapper.classList.add(isMe ? 'sent' : 'received');

  var isFirst = (lastUser !== sender) || (lastMsgType === 'new_day') || (lastMsgType === 'voice_call') || (lastMsgType === 'video_call');
  wrapper.classList.add(isFirst ? 'first' : 'next');

  // Left-side received — show avatar (only on LAST in group visually; we show on first for simplicity)
  if (!isMe) {
    var avatarWrap = el('div', 'avatar_msg');
    if (!isFirst) avatarWrap.classList.add('spacer'); // invisible placeholder for alignment
    var avInner = el('div');
    if (isFirst) avInner.style.backgroundImage = "url('" + user.avatar + "')";
    avatarWrap.appendChild(avInner);
    wrapper.appendChild(avatarWrap);
  }

  var stack = el('div', 'message-stack');

  // Sender name above first received bubble from "them"
  if (!isMe && isFirst && users.filter(function (u) { return u.role !== 'me'; }).length > 1) {
    // only show the sender-name when there are multiple "them" members
    var nameLabel = el('div', 'sender-name');
    nameLabel.textContent = user.name;
    // sender-name sits *above* the avatar row; stack as separate row
    root.appendChild(wrapIndent(nameLabel, isMe));
  }

  var msg = el('div', 'message');
  msg.classList.add(isMe ? 'sent' : 'received');
  if (!isFirst) msg.classList.add('next');
  else msg.classList.add('first');
  msg.classList.add('last');
  msg.classList.add(isSeen ? 'seen' : 'unseen');

  if (type === 'text') {
    msg.textContent = opts.text;
    appendDeleteHover(msg);
  } else if (type === 'image') {
    msg.classList.add('msg_img');
    msg.style.backgroundImage = "url('" + opts.data + "')";
    msg.style.backgroundSize = 'cover';
    msg.style.backgroundPosition = 'center';
    msg.innerHTML = '<img src="' + opts.data + '" style="visibility: hidden;" width="100%">';
    appendDeleteHover(msg);
  } else if (type === 'sticker') {
    msg.classList.add('msg_sticker');
    msg.innerHTML = '<img src="' + opts.data + '" style="max-width:150px;">';
    appendDeleteHover(msg);
  } else if (type === 'voice') {
    msg.classList.add('voice');
    var durSec = Math.max(3, Math.floor(Math.random() * (maxVoiceMinute * 60)));
    var durStr = zeroPad(Math.floor(durSec / 60), 2) + ':' + zeroPad(durSec % 60, 2);
    var bars = '';
    for (var i = 0; i < 22; i++) {
      var h = 4 + Math.floor(Math.random() * 18);
      bars += '<span style="height:' + h + 'px"></span>';
    }
    msg.innerHTML =
      '<div class="voice_message_wrapper">' +
        '<div class="voice-play-ic"><span class="material-icons" style="font-size:18px; color:' + (isMe ? '#fff' : '#0084ff') + ';">play_arrow</span></div>' +
        '<div class="voice-waveform">' + bars + '</div>' +
        '<span class="voice-duration" contentEditable="true">' + durStr + '</span>' +
      '</div>';
    appendDeleteHover(msg);
  }

  // Metadata — show only on LAST bubble of a burst (we always set last; cleared next time)
  var meta = el('span', 'metadata');
  meta.innerHTML = '<span class="time" contentEditable="true">' + currentMessageTime() + '</span>';
  msg.appendChild(meta);

  stack.appendChild(msg);

  // Seen indicator for sent messages (Messenger-style avatar check)
  if (isMe && isSeen) {
    var seen = el('div', 'seen-indicator');
    // Show the other side's tiny avatar(s) as seen markers
    var them = users.filter(function (u) { return u.role !== 'me'; });
    if (them.length === 0) {
      seen.innerHTML = '<span class="seen-check"><span class="material-icons" style="font-size:12px; color:#0084ff;">check_circle</span></span>';
    } else {
      them.slice(0, 2).forEach(function (t) {
        var a = el('span', 'seen-avatar');
        a.style.backgroundImage = "url('" + t.avatar + "')";
        seen.appendChild(a);
      });
    }
    stack.appendChild(seen);
  } else if (isMe && !isSeen) {
    var delivered = el('div', 'seen-indicator');
    delivered.innerHTML = '<span class="seen-check"><span class="material-icons" style="font-size:14px; color:#0084ff;">check_circle_outline</span></span>';
    stack.appendChild(delivered);
  }

  wrapper.appendChild(stack);
  root.appendChild(wrapper);
  root.__msg_type = type;
  root.__sender = sender;
  return root;
}

function wrapIndent(node, isMe) {
  var w = el('div');
  w.style.display = 'flex';
  w.style.justifyContent = isMe ? 'flex-end' : 'flex-start';
  w.appendChild(node);
  return w;
}

function appendDeleteHover(msg) {
  var del = el('a', 'button-delete-hover');
  del.href = '#';
  del.innerHTML = '<svg width="20" height="20" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><path d="M13.05 42q-1.25 0-2.125-.875T10.05 39V10.5H8v-3h9.4V6h13.2v1.5H40v3h-2.05V39q0 1.2-.9 2.1-.9.9-2.1.9Z" fill="#fff"/></svg>';
  del.onclick = function (e) {
    e.preventDefault();
    var root = msg.closest('.msg_root');
    if (!root) return;
    if (!confirm('Delete this message?')) return;
    removeMessageFromDb(root.__dbId);
    root.remove();
    reindexAfterDelete();
  };
  msg.appendChild(del);
}

function reindexAfterDelete() {
  // Recalculate lastUser/lastMsgType from DOM
  var roots = conversation.querySelectorAll('.msg_root');
  if (roots.length === 0) { lastUser = null; lastMsgType = null; return; }
  var last = roots[roots.length - 1];
  lastUser = last.__sender;
  lastMsgType = last.__msg_type;
}

function reRenderConversation() {
  // After role change / avatar change / name change, repaint existing messages
  var roots = Array.from(conversation.querySelectorAll('.msg_root'));
  // Preserve db metadata
  var snapshot = roots.map(function (r) { return { type: r.__msg_type, sender: r.__sender, text: r.__text, data: r.__data, dbId: r.__dbId }; });
  conversation.innerHTML = '';
  lastUser = null; lastMsgType = null;
  snapshot.forEach(function (s) {
    var dom = buildMessageDom({ type: s.type, sender: s.sender, text: s.text, data: s.data });
    dom.__text = s.text;
    dom.__data = s.data;
    dom.__dbId = s.dbId;
    conversation.appendChild(dom);
    lastUser = s.sender;
    lastMsgType = s.type;
  });
}

/* ------------ Send actions ------------ */
function sendText(text) {
  if (!text) return;
  // URL detection: show as text (simple)
  var dom = buildMessageDom({ type: 'text', sender: activeUserId, text: text });
  dom.__text = text;
  appendAndPersist(dom, 'text', text, '');
}

function sendImage(file) {
  if (!file) return;
  var r = new FileReader();
  r.onload = function (e) {
    var dataUrl = e.target.result;
    var dom = buildMessageDom({ type: 'image', sender: activeUserId, data: dataUrl });
    dom.__data = dataUrl;
    appendAndPersist(dom, 'image', '', '');
  };
  r.readAsDataURL(file);
}

function sendSticker(file) {
  if (!file) return;
  var r = new FileReader();
  r.onload = function (e) {
    var dataUrl = e.target.result;
    var dom = buildMessageDom({ type: 'sticker', sender: activeUserId, data: dataUrl });
    dom.__data = dataUrl;
    appendAndPersist(dom, 'sticker', '', '');
  };
  r.readAsDataURL(file);
}

function sendVoice() {
  var dom = buildMessageDom({ type: 'voice', sender: activeUserId });
  appendAndPersist(dom, 'voice', '', '');
}

function sendVoiceCall() {
  var dom = buildMessageDom({ type: 'voice_call', sender: activeUserId });
  appendAndPersist(dom, 'voice_call', '', '');
  lastUser = 'call';
}

function sendVideoCall() {
  var dom = buildMessageDom({ type: 'video_call', sender: activeUserId });
  appendAndPersist(dom, 'video_call', '', '');
  lastUser = 'call';
}

function addNewDay(date) {
  var text = new Date(date).toLocaleDateString();
  var dom = buildMessageDom({ type: 'new_day', sender: 'new_day', text: text });
  appendAndPersist(dom, 'new_day', text, '');
  lastUser = 'new_day';
  // Reset clock
  total_latest_second = 0;
  deviceTime.innerHTML = moment().format('h:mm');
  stopTimeInterval();
  startTimeInterval();
}

function appendAndPersist(dom, type, text, link) {
  var newSender = (type === 'new_day') ? 'new_day' : activeUserId;
  ensureLastClassReset(newSender, type);
  conversation.appendChild(dom);
  conversation.scrollTop = conversation.scrollHeight;
  lastUser = newSender;
  lastMsgType = type;
  saveChatMessage(dom, type, lastUser, text, link);
}

/* ------------ Compose form events ------------ */
$id('form_active_user').addEventListener('submit', function (e) {
  e.preventDefault();
  var inp = $id('input_text_active');
  if (!inp.value.trim()) return;
  sendText(inp.value.trim());
  inp.value = '';
});

$id('photo_btn').addEventListener('click', function () { $id('imgInpActive').click(); });
$id('sticker_btn').addEventListener('click', function () { $id('stickerInpActive').click(); });
$id('imgInpActive').addEventListener('change', function (e) { sendImage(e.target.files[0]); });
$id('stickerInpActive').addEventListener('change', function (e) { sendSticker(e.target.files[0]); });

$id('voice_button_active').addEventListener('click', sendVoice);

/* ------------ In-phone iOS compose bar ------------ */
document.querySelectorAll('.compose-ic-plus').forEach(function (n) {
  n.addEventListener('click', function () { $id('imgInpActive').click(); });
});
document.querySelectorAll('.compose-ic-camera').forEach(function (n) {
  n.addEventListener('click', function () {
    var inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = 'image/*';
    inp.capture = 'environment';
    inp.onchange = function (e) { sendImage(e.target.files[0]); };
    inp.click();
  });
});
document.querySelectorAll('.compose-ic-photo').forEach(function (n) {
  n.addEventListener('click', function () { $id('imgInpActive').click(); });
});
document.querySelectorAll('.compose-ic-mic').forEach(function (n) {
  n.addEventListener('click', function () { sendVoice(); });
});
document.querySelectorAll('.compose-ic-inline').forEach(function (n) {
  n.addEventListener('click', function () { $id('stickerInpActive').click(); });
});
document.querySelectorAll('.compose-like').forEach(function (n) {
  n.addEventListener('click', function () { sendText('\uD83D\uDC4D'); });
});
$id('form_screenshot_bar').addEventListener('submit', function (e) { e.preventDefault(); });

$id('ua_voice_call_btn').addEventListener('click', sendVoiceCall);
$id('ua_video_call_btn').addEventListener('click', sendVideoCall);
$id('voice_call_btn').addEventListener('click', sendVoiceCall);
$id('video_call_btn').addEventListener('click', sendVideoCall);

/* ------------ Status radios ------------ */
$id('status-delivered').addEventListener('click', function () { isSeen = false; });
$id('status-read').addEventListener('click', function () { isSeen = true; });
$id('call_done').addEventListener('click', function () { callStatusDone = true; });
$id('missed_call').addEventListener('click', function () { callStatusDone = false; });

/* ------------ Status bar toggles ------------ */
['bar1', 'bar2', 'bar3', 'bar4', 'bar5'].forEach(function (id, idx) {
  var map = ['status-bar-vibrate', 'status-bar-wifi', 'status-bar-lte', 'status-bar-sinal', 'status-bar-sinal2'];
  $id(id).addEventListener('change', function (e) {
    $id(map[idx]).style.display = e.target.checked ? '' : 'none';
  });
});

$id('battery1').addEventListener('click', function () {
  $id('status-bar-battery').setAttribute('data-battery', '1');
  $id('battery_percentage').innerHTML = '45%';
});
$id('battery2').addEventListener('click', function () {
  $id('status-bar-battery').setAttribute('data-battery', '2');
  $id('battery_percentage').innerHTML = '85%';
});

['device_height1', 'device_height2', 'device_height3', 'device_height4'].forEach(function (id, idx) {
  var heights = [658, 670, 628, 600];
  $id(id).addEventListener('click', function () {
    $id('device_model').style.cssText = 'height: ' + heights[idx] + 'px !important;';
  });
});

/* ------------ Clock ------------ */
$id('clock-am').addEventListener('click', function () { inp_time_format = 'AM'; });
$id('clock-pm').addEventListener('click', function () { inp_time_format = 'PM'; });

function bindTimeInputs() {
  var hInput = $id('clock-hour');
  var mInput = $id('clock-minute');
  var btn = $id('setTime');
  function maybeShow() {
    btn.style.display = (hInput.value && mInput.value) ? '' : 'none';
  }
  hInput.addEventListener('input', maybeShow);
  mInput.addEventListener('input', maybeShow);
}
bindTimeInputs();

$id('setTime').addEventListener('click', function () {
  var h = parseInt($id('clock-hour').value, 10);
  var m = parseInt($id('clock-minute').value, 10);
  if (isNaN(h) || isNaN(m) || h < 1 || h > 12 || m < 0 || m > 59) { alert('Invalid time'); return; }
  var newStr = h + ':' + zeroPad(m, 2) + ' ' + inp_time_format;
  var newSec = stringTimeToSecond(newStr);
  if (total_latest_second && newSec < total_latest_second) { alert('Time must be later than previous.'); return; }
  total_latest_second = newSec;
  time_format = inp_time_format;
  deviceTime.innerHTML = h + ':' + zeroPad(m, 2);
  startCustomTimeInterval();
  $id('clock-hour').value = '';
  $id('clock-minute').value = '';
  $id('setTime').style.display = 'none';
});

/* ------------ New day picker ------------ */
$id('new_chat_day').addEventListener('change', function (e) {
  if (e.target.value) {
    $id('generateNewDay').style.display = '';
    var lbl = document.querySelector('.datepicker_label');
    if (lbl) lbl.textContent = moment(new Date(e.target.value)).format('MM/DD/YYYY');
  }
});
$id('generateNewDay').addEventListener('click', function () {
  var v = $id('new_chat_day').value;
  if (!v) return;
  addNewDay(new Date(v));
  $id('generateNewDay').style.display = 'none';
});

/* ------------ Voice file number ------------ */
$id('voice_file_no').addEventListener('submit', function (e) {
  e.preventDefault();
  var v = parseInt($id('inp_voice_no').value, 10);
  if (!isNaN(v)) noOfVoiceFile = v;
});

/* ------------ Screenshot (chat screen only, not phone bezel) ------------ */
$id('capture_screen').addEventListener('click', function () {
  var target = $id('screenshot_target'); // .screen-container (iOS status bar + header + chat + compose)
  html2canvas(target, { useCORS: true, allowTaint: true, backgroundColor: '#ffffff', scale: 2 }).then(function (canvas) {
    var container = $id('screen_shot');
    container.style.display = '';
    container.innerHTML = '<h2>Screenshot</h2>';
    var link = document.createElement('a');
    link.download = 'messenger_chat_' + Date.now() + '.png';
    link.href = canvas.toDataURL('image/png');
    link.textContent = 'Download screenshot';
    link.style.display = 'inline-block';
    link.style.marginBottom = '12px';
    link.style.color = '#0084ff';
    container.appendChild(link);
    container.appendChild(canvas);
    canvas.style.maxWidth = '375px';
    canvas.style.border = '1px solid #e4e6eb';
    canvas.style.borderRadius = '6px';
    canvas.style.boxShadow = '0 6px 24px rgba(0,0,0,0.18)';
    window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
  }).catch(function (err) {
    alert('Screenshot failed: ' + err.message);
  });
});

/* ------------ PouchDB helpers ------------ */
function ensureMsgDb() {
  if (!window.PouchDB) return null;
  return new PouchDB('fbmsg_messages');
}
function ensureRoomDb() {
  if (!window.PouchDB) return null;
  return new PouchDB('fbmsg_rooms');
}

function saveChatMessage(dom, type, sender, text, link) {
  var db = ensureMsgDb();
  if (!db) return;
  var doc = {
    _id: new Date().toISOString() + '_' + Math.random().toString(36).slice(2, 8),
    room: currentChatRoomId || 'default',
    type: type,
    sender: sender,
    text: text || '',
    data: dom.__data || '',
    html: dom.outerHTML,
    time: currentMessageTime(),
    created_at: new Date().toISOString()
  };
  db.put(doc).then(function (res) {
    dom.__dbId = res.id;
  }).catch(function (err) { console.warn('save failed', err); });
}

function removeMessageFromDb(id) {
  if (!id) return;
  var db = ensureMsgDb();
  if (!db) return;
  db.get(id).then(function (doc) { db.remove(doc); }).catch(function () {});
}

/* ------------ Chat room list ------------ */
function populateChatRoomList() {
  var panel = $id('list-item-panel');
  var db = ensureRoomDb();
  if (!panel || !db) return;
  db.allDocs({ include_docs: true, descending: true }).then(function (res) {
    panel.innerHTML = '';
    if (res.rows.length === 0) {
      panel.innerHTML = '<div style="padding:12px; color:#65676b; background:#fff;">No chat rooms yet. Click <b>Create chat-room</b> to add one.</div>';
      return;
    }
    res.rows.forEach(function (row) {
      var d = row.doc;
      var a = document.createElement('a');
      a.href = '#';
      a.className = 'list-group-item list-group-item-action';
      a.style.padding = '12px';
      a.innerHTML =
        '<div class="actor" style="align-items: flex-start;">' +
          '<div style="display: flex;">' +
            (d.members || []).slice(0, 2).map(function (m, i) {
              return '<div class="avatar_caht_list" style="background-image:url(\'' + (m.avatar || DEFAULT_AVATARS[i]) + '\'); margin-left:' + (i > 0 ? '-20px' : '0') + ';"></div>';
            }).join('') +
          '</div>' +
          '<div class="chat-list-row" style="margin-left:8px;">' +
            '<h6 class="caht-list-name">' + d.name + '</h6>' +
            '<small class="chat-list-date">Create: ' + (d.created_at || '') + '</small>' +
          '</div>' +
        '</div>';
      a.onclick = function (e) { e.preventDefault(); loadChatRoom(d._id); };
      panel.appendChild(a);
    });
  });
}

function loadChatRoom(roomId) {
  currentChatRoomId = roomId;
  var db = ensureRoomDb();
  db.get(roomId).then(function (room) {
    $id('chat_name').textContent = room.name;
    users = room.members && room.members.length ? room.members.slice() : users;
    activeUserId = users[0].id;
    renderAll();
    conversation.innerHTML = '';
    lastUser = null; lastMsgType = null;
    // Load messages
    var msgDb = ensureMsgDb();
    msgDb.allDocs({ include_docs: true }).then(function (r) {
      var msgs = r.rows.filter(function (x) { return x.doc.room === roomId; });
      msgs.sort(function (a, b) { return a.doc.created_at.localeCompare(b.doc.created_at); });
      msgs.forEach(function (x) {
        var doc = x.doc;
        var dom = buildMessageDom({
          type: doc.type,
          sender: doc.sender,
          text: doc.text,
          data: doc.data
        });
        dom.__text = doc.text;
        dom.__data = doc.data;
        dom.__dbId = doc._id;
        conversation.appendChild(dom);
        lastUser = doc.sender;
        lastMsgType = doc.type;
      });
      conversation.scrollTop = conversation.scrollHeight;
    });
  });
}

/* ------------ Navbar links ------------ */
$id('show-chat-room').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('chat_room_list').style.display = '';
  populateChatRoomList();
});
$id('close-chatlist').addEventListener('click', function (e) {
  e.preventDefault();
  document.getElementById('chat_room_list').style.display = 'none';
});

$id('show-data-panel').addEventListener('click', function (e) {
  e.preventDefault();
  $id('data_modify_panel').style.display = '';
});
$id('close-data-modify').addEventListener('click', function (e) {
  e.preventDefault();
  $id('data_modify_panel').style.display = 'none';
});

$id('delete-room').addEventListener('click', function () {
  if (!currentChatRoomId) { alert('No room selected'); return; }
  if (!confirm('Delete current chat room?')) return;
  var rdb = ensureRoomDb();
  var mdb = ensureMsgDb();
  rdb.get(currentChatRoomId).then(function (doc) { rdb.remove(doc); });
  mdb.allDocs({ include_docs: true }).then(function (r) {
    r.rows.forEach(function (x) {
      if (x.doc.room === currentChatRoomId) mdb.remove(x.doc);
    });
  });
  conversation.innerHTML = '';
  currentChatRoomId = null;
  alert('Deleted.');
});

$id('clearn-db').addEventListener('click', function () {
  if (!confirm('Destroy ALL rooms and messages?')) return;
  (new PouchDB('fbmsg_rooms')).destroy();
  (new PouchDB('fbmsg_messages')).destroy();
  conversation.innerHTML = '';
  currentChatRoomId = null;
  alert('All data destroyed.');
});

$id('optimize-db').addEventListener('click', function () {
  var mdb = ensureMsgDb();
  mdb.compact().then(function () { alert('Optimized.'); });
});

/* ------------ Create chat room modal ------------ */
$id('create-chat-room').addEventListener('click', function (e) {
  e.preventDefault();
  document.querySelector('.form-popup-bg.chatroom').classList.add('is-visible');
  renderInitialMembersSlots();
});

document.querySelectorAll('.form-popup-bg .close-button').forEach(function (btn) {
  btn.addEventListener('click', function () {
    btn.closest('.form-popup-bg').classList.remove('is-visible');
  });
});

function renderInitialMembersSlots() {
  var host = $id('chatroom_initial_members');
  host.innerHTML = '';
  users.forEach(function (u) {
    var row = el('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.gap = '8px';
    row.style.marginBottom = '6px';
    var av = el('div');
    av.style.width = '42px'; av.style.height = '42px'; av.style.borderRadius = '50%';
    av.style.backgroundImage = "url('" + u.avatar + "')"; av.style.backgroundSize = 'cover'; av.style.cursor = 'pointer';
    av.onclick = function () { triggerAvatarChange(u.id); };
    var nm = el('span'); nm.textContent = u.name; nm.style.color = '#050505';
    row.appendChild(av); row.appendChild(nm);
    host.appendChild(row);
  });
}

$id('create-chat-room-btn').addEventListener('click', function () {
  var name = $id('chat-room-name-input').value.trim();
  if (!name) { alert('Enter chat room name'); return; }
  var rdb = ensureRoomDb();
  var doc = {
    _id: 'room_' + Date.now(),
    name: name,
    members: users.slice(),
    created_at: new Date().toLocaleDateString()
  };
  rdb.put(doc).then(function () {
    currentChatRoomId = doc._id;
    $id('chat_name').textContent = name;
    document.querySelector('.form-popup-bg.chatroom').classList.remove('is-visible');
    $id('chat-room-name-input').value = '';
    alert('Chat room "' + name + '" created.');
  });
});

/* ------------ Export data ------------ */
$id('export_data').addEventListener('click', function () {
  var mdb = ensureMsgDb();
  mdb.allDocs({ include_docs: true }).then(function (r) {
    var msgs = r.rows.map(function (x) { return x.doc; });
    var rdb = ensureRoomDb();
    rdb.allDocs({ include_docs: true }).then(function (r2) {
      var rooms = r2.rows.map(function (x) { return x.doc; });
      var blob = new Blob([JSON.stringify({ rooms: rooms, messages: msgs, users: users }, null, 2)], { type: 'application/json' });
      var a = document.createElement('a');
      a.href = URL.createObjectURL(blob);
      a.download = 'fbmsg_chat_' + Date.now() + '.json';
      a.click();
    });
  });
});

/* ------------ Import ------------ */
$id('import_chatroom_db').addEventListener('change', function (e) {
  var f = e.target.files[0]; if (!f) return;
  var r = new FileReader();
  r.onload = function (ev) {
    try {
      var data = JSON.parse(ev.target.result);
      var rdb = ensureRoomDb();
      (data.rooms || []).forEach(function (room) {
        delete room._rev;
        rdb.put(room).catch(function () {});
      });
      alert('Imported ' + (data.rooms || []).length + ' rooms.');
    } catch (err) { alert('Invalid file'); }
  };
  r.readAsText(f);
});

$id('import_chatmsg_db').addEventListener('change', function (e) {
  var f = e.target.files[0]; if (!f) return;
  var r = new FileReader();
  r.onload = function (ev) {
    try {
      var data = JSON.parse(ev.target.result);
      var mdb = ensureMsgDb();
      (data.messages || []).forEach(function (m) {
        delete m._rev;
        mdb.put(m).catch(function () {});
      });
      alert('Imported ' + (data.messages || []).length + ' messages.');
    } catch (err) { alert('Invalid file'); }
  };
  r.readAsText(f);
});

/* ------------ Show message date list ------------ */
$id('showMsgDate').addEventListener('click', function () {
  var dateList = document.querySelector('.chat-msgdate-list');
  dateList.style.display = '';
  var host = $id('msg_date');
  host.innerHTML = '';
  // Collect unique dates from .current_new_day nodes + "Today"
  var dateSet = new Set();
  dateSet.add('Today');
  conversation.querySelectorAll('.current_new_day .time').forEach(function (n) { dateSet.add(n.textContent); });
  Array.from(dateSet).forEach(function (d) {
    var row = el('div');
    row.style.display = 'flex';
    row.style.alignItems = 'center';
    row.style.padding = '6px';
    row.style.borderBottom = '1px solid #e4e6eb';
    row.innerHTML = '<input type="checkbox" class="date-check" value="' + d + '" style="margin-right:8px;"> <span>' + d + '</span>';
    host.appendChild(row);
  });
});
$id('close-msgdate-list').addEventListener('click', function (e) {
  e.preventDefault();
  document.querySelector('.chat-msgdate-list').style.display = 'none';
});
$id('select-all').addEventListener('click', function () {
  document.querySelectorAll('.date-check').forEach(function (c) { c.checked = true; });
});
$id('deselect-all').addEventListener('click', function () {
  document.querySelectorAll('.date-check').forEach(function (c) { c.checked = false; });
});
$id('showMsgSelectedDate').addEventListener('click', function () {
  var dates = Array.from(document.querySelectorAll('.date-check:checked')).map(function (c) { return c.value; });
  alert('Selected dates: ' + dates.join(', '));
});

/* ------------ Initial render ------------ */
renderAll();
$id('input_text_active').placeholder = 'Send as ' + findUser(activeUserId).name + '...';

/* Welcome seed messages */
setTimeout(function () {
  // seed only if conversation is empty
  if (conversation.children.length === 0) {
    activeUserId = users[1] ? users[1].id : users[0].id;
    sendText("Hey everyone! Welcome to the group chat.");
    setTimeout(function () {
      activeUserId = 'me';
      $id('active_user_select').value = 'me';
      sendText("Thanks! Excited to be here.");
    }, 300);
  }
}, 150);
