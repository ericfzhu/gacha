import { motion } from 'framer-motion';

export default function SettingsModal({ settings, onChange, onClose }) {
  return (
    <div className="settings-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onClose(); }}>
      <motion.div className="settings-modal" role="dialog" aria-modal="true" aria-labelledby="settings-title" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 8 }} transition={{ duration: .2, bounce: 0 }}>
        <div className="settings-heading"><div><p>CLIENT CONFIGURATION</p><h2 id="settings-title">Settings</h2></div><button aria-label="Close settings" onClick={onClose}>×</button></div>
        <div className="settings-options">
          <div><span><b>Audio</b><small>Music and battle effects</small></span><button className={settings.muted ? '' : 'active'} onClick={() => onChange({ ...settings, muted: !settings.muted })}>{settings.muted ? 'Muted' : 'On'}</button></div>
          <label><span><b>Display quality</b><small>Visual effects and texture detail</small></span><select value={settings.quality} onChange={(event) => onChange({ ...settings, quality: event.target.value })}><option value="high">High</option><option value="medium">Medium</option><option value="low">Low</option></select></label>
        </div>
        <button className="settings-done" onClick={onClose}>Confirm</button>
      </motion.div>
    </div>
  );
}
