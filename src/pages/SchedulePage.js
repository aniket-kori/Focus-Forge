import React, { useState, useEffect } from 'react';
import { ScheduleDB } from '../utils/db';
import { Modal, Btn, Card, SectionHeader } from '../components/SharedComponents';
import './SchedulePage.css';

const pad = n => String(n).padStart(2, '0');
function fmtDur(m) { return m < 60 ? `${m}m` : `${Math.floor(m / 60)}h${m % 60 > 0 ? ` ${m % 60}m` : ''}`; }

function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 5); }

const COLORS = ['#4a9b82','#5b8dee','#c09040','#9b4a82','#4a6b9b','#9b6a4a','#6a9b4a','#c05548'];

const TYPE_OPTIONS = [
  { val: 'study', label: '📚 Study' },
  { val: 'break', label: '🍃 Break' },
];

const SUBJECT_SUGGESTIONS = ['Mathematics','Physics','Chemistry','Biology','English','History','Geography','Computer Science','Economics','Revision','Mock Test','Reading'];

// ── BlockEditor: edit a single block row ──────────────────────
function BlockRow({ block, idx, total, onEdit, onDelete, onMove }) {
  return (
    <div className="block-row">
      <div className={`block-type-bar ${block.type}`} />
      <div className="block-row-content">
        <div className="block-row-left">
          <span className="block-time">{block.startTime}</span>
          <div className="block-row-names">
            <span className="block-name">{block.name}</span>
            {block.subject && <span className="block-subject-tag">{block.subject}</span>}
          </div>
        </div>
        <div className="block-row-right">
          <span className="block-dur-badge">{fmtDur(block.duration)}</span>
          <div className="block-actions">
            <button className="bact-btn" onClick={() => onMove(idx, -1)} disabled={idx === 0} title="Move up">↑</button>
            <button className="bact-btn" onClick={() => onMove(idx, 1)} disabled={idx === total - 1} title="Move down">↓</button>
            <button className="bact-btn edit" onClick={() => onEdit(idx)} title="Edit">✏️</button>
            <button className="bact-btn del" onClick={() => onDelete(idx)} title="Delete">✕</button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ── Block form modal ──────────────────────────────────────────
function BlockModal({ block, onSave, onClose }) {
  const [form, setForm] = useState(block || {
    name: '', type: 'study', startTime: '08:00', duration: 45, subject: '', notes: '',
  });

  function set(k, v) { setForm(f => ({ ...f, [k]: v })); }

  function save() {
    if (!form.name.trim()) return;
    onSave({ ...form, id: form.id || 'b_' + uid() });
  }

  return (
    <Modal title={block ? 'Edit Block' : 'Add Block'} onClose={onClose}>
      <div className="block-form">
        <div className="form-row">
          <div className="form-field">
            <label className="field-label-sm">Block Name *</label>
            <input className="sc-input" value={form.name} onChange={e => set('name', e.target.value)}
              placeholder="e.g. Mathematics — Calculus" />
          </div>
        </div>
        <div className="form-row cols-2">
          <div className="form-field">
            <label className="field-label-sm">Type</label>
            <div className="type-toggle">
              {TYPE_OPTIONS.map(t => (
                <button key={t.val} className={`type-opt ${form.type === t.val ? 'selected' : ''}`}
                  onClick={() => set('type', t.val)}>{t.label}</button>
              ))}
            </div>
          </div>
          <div className="form-field">
            <label className="field-label-sm">Start Time</label>
            <input type="time" className="sc-input mono" value={form.startTime}
              onChange={e => set('startTime', e.target.value)} />
          </div>
        </div>
        <div className="form-row cols-2">
          <div className="form-field">
            <label className="field-label-sm">Duration: <strong>{form.duration} min</strong></label>
            <input type="range" min={5} max={180} step={5} value={form.duration}
              onChange={e => set('duration', +e.target.value)}
              className="sc-range" />
            <div className="range-labels"><span>5m</span><span>3h</span></div>
          </div>
          <div className="form-field">
            <label className="field-label-sm">Subject (optional)</label>
            <input className="sc-input" value={form.subject}
              onChange={e => set('subject', e.target.value)} list="subject-list"
              placeholder="e.g. Mathematics" />
            <datalist id="subject-list">
              {SUBJECT_SUGGESTIONS.map(s => <option key={s} value={s} />)}
            </datalist>
          </div>
        </div>
        <div className="form-field">
          <label className="field-label-sm">Notes / Focus area (optional)</label>
          <textarea className="sc-input" rows={2} value={form.notes}
            onChange={e => set('notes', e.target.value)}
            placeholder="e.g. Focus on integration by parts, Chapter 5 exercises" />
        </div>
        <div className="modal-actions">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="solid" color="var(--accent)" onClick={save}>
            {block ? 'Save Changes' : 'Add Block'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Schedule form modal ───────────────────────────────────────
function ScheduleModal({ schedule, userId, onSave, onClose }) {
  const isEdit = !!schedule;
  const [name, setName] = useState(schedule?.name || '');
  const [desc, setDesc] = useState(schedule?.description || '');
  const [color, setColor] = useState(schedule?.color || COLORS[0]);
  const [blocks, setBlocks] = useState(schedule?.blocks ? JSON.parse(JSON.stringify(schedule.blocks)) : []);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [editingBlock, setEditingBlock] = useState(null);
  const [editingIdx, setEditingIdx] = useState(null);

  function addOrUpdateBlock(block) {
    if (editingIdx !== null) {
      setBlocks(prev => prev.map((b, i) => i === editingIdx ? block : b));
    } else {
      setBlocks(prev => [...prev, block]);
    }
    setShowBlockForm(false);
    setEditingBlock(null);
    setEditingIdx(null);
  }

  function deleteBlock(idx) { setBlocks(prev => prev.filter((_, i) => i !== idx)); }

  function moveBlock(idx, dir) {
    setBlocks(prev => {
      const arr = [...prev];
      const to = idx + dir;
      if (to < 0 || to >= arr.length) return arr;
      [arr[idx], arr[to]] = [arr[to], arr[idx]];
      return arr;
    });
  }

  function save() {
    if (!name.trim()) return;
    const data = { name: name.trim(), description: desc.trim(), color, blocks };
    if (isEdit) {
      onSave(ScheduleDB.update(schedule.id, data));
    } else {
      onSave(ScheduleDB.create(userId, data));
    }
    onClose();
  }

  const totalMin = blocks.reduce((a, b) => a + b.duration, 0);

  return (
    <Modal title={isEdit ? `Edit: ${schedule.name}` : 'Create New Schedule'} onClose={onClose} wide>
      {showBlockForm && (
        <BlockModal
          block={editingBlock}
          onSave={addOrUpdateBlock}
          onClose={() => { setShowBlockForm(false); setEditingBlock(null); setEditingIdx(null); }}
        />
      )}
      <div className="schedule-form">
        <div className="form-row cols-2">
          <div className="form-field">
            <label className="field-label-sm">Schedule Name *</label>
            <input className="sc-input" value={name} onChange={e => setName(e.target.value)}
              placeholder="e.g. JEE Preparation" />
          </div>
          <div className="form-field">
            <label className="field-label-sm">Color Theme</label>
            <div className="color-picker">
              {COLORS.map(c => (
                <button key={c} className={`color-dot ${color === c ? 'selected' : ''}`}
                  style={{ background: c }} onClick={() => setColor(c)} />
              ))}
            </div>
          </div>
        </div>
        <div className="form-field">
          <label className="field-label-sm">Description (optional)</label>
          <input className="sc-input" value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="e.g. Daily schedule for JEE Mains preparation" />
        </div>

        {/* Blocks section */}
        <div className="blocks-section">
          <div className="blocks-header">
            <div>
              <div className="label">Time Blocks ({blocks.length})</div>
              {blocks.length > 0 && (
                <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 2 }}>
                  Total: {fmtDur(totalMin)}
                </div>
              )}
            </div>
            <Btn variant="outline" color="var(--accent)" small
              onClick={() => { setEditingBlock(null); setEditingIdx(null); setShowBlockForm(true); }}>
              + Add Block
            </Btn>
          </div>

          {blocks.length === 0 ? (
            <div className="blocks-empty">
              No blocks yet. Add study sessions and breaks above.
            </div>
          ) : (
            <div className="blocks-list">
              {blocks.map((b, i) => (
                <BlockRow key={b.id || i} block={b} idx={i} total={blocks.length}
                  onEdit={idx => { setEditingBlock(blocks[idx]); setEditingIdx(idx); setShowBlockForm(true); }}
                  onDelete={deleteBlock}
                  onMove={moveBlock}
                />
              ))}
            </div>
          )}
        </div>

        <div className="modal-actions">
          <Btn variant="ghost" onClick={onClose}>Cancel</Btn>
          <Btn variant="solid" color={color} onClick={save}>
            {isEdit ? '💾 Save Changes' : '✨ Create Schedule'}
          </Btn>
        </div>
      </div>
    </Modal>
  );
}

// ── Main SchedulePage ─────────────────────────────────────────
export default function SchedulePage({ user }) {
  const [schedules, setSchedules] = useState([]);
  const [activeId, setActiveId]   = useState(null);
  const [showCreate, setShowCreate] = useState(false);
  const [editing, setEditing]       = useState(null);
  const [deleteId, setDeleteId]     = useState(null);

  function reload() {
    const all = ScheduleDB.getAll(user.id);
    setSchedules(all);
    const act = ScheduleDB.getActive(user.id);
    setActiveId(act?.id || null);
  }

  useEffect(() => { reload(); }, [user]);

  function activate(id) {
    ScheduleDB.setActive(user.id, id);
    setActiveId(id);
  }

  function handleSaved(sch) {
    reload();
  }

  function confirmDelete(id) {
    ScheduleDB.delete(id);
    if (activeId === id) {
      const remaining = schedules.filter(s => s.id !== id);
      if (remaining.length > 0) ScheduleDB.setActive(user.id, remaining[0].id);
    }
    setDeleteId(null);
    reload();
  }

  return (
    <div className="schedule-page">
      {/* Modals */}
      {showCreate && (
        <ScheduleModal userId={user.id} onSave={handleSaved} onClose={() => setShowCreate(false)} />
      )}
      {editing && (
        <ScheduleModal schedule={editing} userId={user.id}
          onSave={handleSaved} onClose={() => setEditing(null)} />
      )}
      {deleteId && (
        <Modal title="Delete Schedule" onClose={() => setDeleteId(null)}>
          <p style={{ color: 'var(--text-muted)', marginBottom: 20 }}>
            Are you sure you want to delete this schedule? This cannot be undone.
          </p>
          <div className="modal-actions">
            <Btn variant="ghost" onClick={() => setDeleteId(null)}>Cancel</Btn>
            <Btn variant="solid" color="var(--danger)" onClick={() => confirmDelete(deleteId)}>Delete</Btn>
          </div>
        </Modal>
      )}

      {/* Page header */}
      <div className="page-header">
        <div>
          <h2 className="page-title">Schedules</h2>
          <p className="page-subtitle">Create, edit and manage your study schedules. Activate one to use in the Timer.</p>
        </div>
        <Btn variant="solid" color="var(--accent)" onClick={() => setShowCreate(true)}>
          + New Schedule
        </Btn>
      </div>

      {/* Schedule cards */}
      {schedules.length === 0 ? (
        <div className="empty-state">
          <div style={{ fontSize: 48 }}>📭</div>
          <h3>No schedules yet</h3>
          <p>Create your first schedule to get started.</p>
          <Btn variant="solid" color="var(--accent)" onClick={() => setShowCreate(true)}>
            Create Schedule
          </Btn>
        </div>
      ) : (
        <div className="schedules-grid">
          {schedules.map(sch => {
            const isActive = sch.id === activeId;
            const studyBlocks = sch.blocks.filter(b => b.type === 'study');
            const breakBlocks = sch.blocks.filter(b => b.type === 'break');
            const totalMin = sch.blocks.reduce((a, b) => a + b.duration, 0);
            return (
              <div key={sch.id} className={`sch-card ${isActive ? 'active' : ''}`}
                style={{ '--sch-color': sch.color }}>
                {/* Color bar */}
                <div className="sch-color-bar" style={{ background: sch.color }} />

                <div className="sch-card-body">
                  <div className="sch-card-head">
                    <div>
                      <div className="sch-name">{sch.name}</div>
                      {sch.description && <div className="sch-desc">{sch.description}</div>}
                    </div>
                    {isActive && <span className="active-badge">● Active</span>}
                  </div>

                  {/* Stats row */}
                  <div className="sch-stats">
                    <div className="sch-stat">
                      <span className="sch-stat-val">{sch.blocks.length}</span>
                      <span className="sch-stat-lbl">Blocks</span>
                    </div>
                    <div className="sch-stat">
                      <span className="sch-stat-val" style={{ color: 'var(--study)' }}>{studyBlocks.length}</span>
                      <span className="sch-stat-lbl">Study</span>
                    </div>
                    <div className="sch-stat">
                      <span className="sch-stat-val" style={{ color: 'var(--brk)' }}>{breakBlocks.length}</span>
                      <span className="sch-stat-lbl">Breaks</span>
                    </div>
                    <div className="sch-stat">
                      <span className="sch-stat-val">{fmtDur(totalMin)}</span>
                      <span className="sch-stat-lbl">Total</span>
                    </div>
                  </div>

                  {/* Block preview timeline */}
                  {sch.blocks.length > 0 && (
                    <div className="sch-timeline">
                      {sch.blocks.map((b, i) => (
                        <div key={i} className={`tl-block ${b.type}`}
                          style={{ flex: b.duration }}
                          title={`${b.name} (${b.duration}m)`}
                        />
                      ))}
                    </div>
                  )}

                  {/* Block list preview */}
                  <div className="sch-block-list">
                    {sch.blocks.slice(0, 5).map((b, i) => (
                      <div key={i} className="sch-block-item">
                        <div className={`sch-block-dot ${b.type}`} />
                        <span className="sch-block-time">{b.startTime}</span>
                        <span className="sch-block-name">{b.name}</span>
                        <span className="sch-block-dur">{fmtDur(b.duration)}</span>
                      </div>
                    ))}
                    {sch.blocks.length > 5 && (
                      <div style={{ fontSize: 11, color: 'var(--text-muted)', paddingLeft: 14 }}>
                        +{sch.blocks.length - 5} more blocks…
                      </div>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="sch-actions">
                    {!isActive ? (
                      <Btn variant="solid" color={sch.color} small onClick={() => activate(sch.id)}>
                        ▶ Set Active
                      </Btn>
                    ) : (
                      <span className="active-msg">✓ Currently in use</span>
                    )}
                    <Btn variant="ghost" small onClick={() => setEditing(sch)}>✏️ Edit</Btn>
                    <Btn variant="ghost" small color="var(--danger)"
                      onClick={() => setDeleteId(sch.id)}>🗑 Delete</Btn>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
