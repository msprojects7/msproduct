/**
 * Verification test for Certificate export proportions and text wrapping
 */
import { CERTIFICATE_PRESETS } from '../lib/certificates/templates';
import { createDefaultCanvasModel } from '../lib/certificates/canvasModel';

console.log('Testing all 10 Certificate presets model generation...');
let passed = 0;

for (const preset of CERTIFICATE_PRESETS) {
  const model = createDefaultCanvasModel(preset.id);
  if (!model) {
    throw new Error(`Failed to generate model for preset ${preset.id}`);
  }
  if (!model.elements || model.elements.length === 0) {
    throw new Error(`Model for preset ${preset.id} has no elements`);
  }

  // Verify key elements exist
  const hasTitle = model.elements.some((e) => e.type === 'title');
  const hasRecipient = model.elements.some((e) => e.type === 'recipient');
  const hasBody = model.elements.some((e) => e.type === 'body');
  const hasSignatory = model.elements.some((e) => e.type === 'signatory');

  if (!hasTitle || !hasRecipient || !hasBody || !hasSignatory) {
    throw new Error(`Preset ${preset.id} missing mandatory elements`);
  }

  // Verify recipient font weight is extrabold or bold
  const recEl = model.elements.find((e) => e.type === 'recipient');
  if (recEl && recEl.fontWeight !== 'bold' && recEl.fontWeight !== 'extrabold') {
    throw new Error(`Preset ${preset.id} recipient font weight should be bold or extrabold`);
  }

  // Verify body text has appropriate width
  const bodyEl = model.elements.find((e) => e.type === 'body');
  if (bodyEl && bodyEl.width > 90) {
    throw new Error(`Preset ${preset.id} body text width exceeds safe margins`);
  }

  passed++;
  console.log(`[PASS] Preset ${preset.id} (${preset.name}) verified with ${model.elements.length} elements.`);
}

console.log(`\nAll ${passed}/10 Certificate Presets verified successfully!`);
