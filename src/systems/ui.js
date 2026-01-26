// UI Utilities - shared micro-interactions and helpers

/**
 * Add press feedback to an interactive game object
 * Scales down on press, bounces back on release
 * @param {Phaser.Scene} scene - The scene
 * @param {Phaser.GameObjects.GameObject} target - The interactive object
 * @param {Object} options - Configuration options
 */
export function addButtonFeedback(scene, target, options = {}) {
  const {
    scaleDown = 0.95,
    scaleBounce = 1.02,
    duration = 80,
  } = options;

  const originalScaleX = target.scaleX || 1;
  const originalScaleY = target.scaleY || 1;

  target.on('pointerdown', () => {
    scene.tweens.add({
      targets: target,
      scaleX: originalScaleX * scaleDown,
      scaleY: originalScaleY * scaleDown,
      duration: duration,
      ease: 'Quad.easeOut',
    });
  });

  target.on('pointerup', () => {
    scene.tweens.add({
      targets: target,
      scaleX: originalScaleX * scaleBounce,
      scaleY: originalScaleY * scaleBounce,
      duration: duration,
      ease: 'Back.easeOut',
      onComplete: () => {
        scene.tweens.add({
          targets: target,
          scaleX: originalScaleX,
          scaleY: originalScaleY,
          duration: duration,
          ease: 'Quad.easeOut',
        });
      }
    });
  });

  target.on('pointerout', () => {
    scene.tweens.add({
      targets: target,
      scaleX: originalScaleX,
      scaleY: originalScaleY,
      duration: duration,
      ease: 'Quad.easeOut',
    });
  });
}

/**
 * Add hover scale effect to an interactive game object
 * @param {Phaser.Scene} scene - The scene
 * @param {Phaser.GameObjects.GameObject} target - The interactive object
 * @param {number} hoverScale - Scale multiplier on hover (default 1.02)
 */
export function addHoverScale(scene, target, hoverScale = 1.02) {
  const originalScaleX = target.scaleX || 1;
  const originalScaleY = target.scaleY || 1;

  target.on('pointerover', () => {
    scene.tweens.add({
      targets: target,
      scaleX: originalScaleX * hoverScale,
      scaleY: originalScaleY * hoverScale,
      duration: 100,
      ease: 'Quad.easeOut',
    });
  });

  target.on('pointerout', () => {
    scene.tweens.add({
      targets: target,
      scaleX: originalScaleX,
      scaleY: originalScaleY,
      duration: 100,
      ease: 'Quad.easeOut',
    });
  });
}

/**
 * Animate a number counting up (for resource gains)
 * @param {Phaser.Scene} scene - The scene
 * @param {Phaser.GameObjects.Text} textObject - The text object to animate
 * @param {number} startValue - Starting number
 * @param {number} endValue - Ending number
 * @param {number} duration - Animation duration in ms
 * @param {string} prefix - Optional prefix (e.g., '$' or '+')
 * @param {string} suffix - Optional suffix
 */
export function animateNumber(scene, textObject, startValue, endValue, duration = 500, prefix = '', suffix = '') {
  const obj = { value: startValue };
  scene.tweens.add({
    targets: obj,
    value: endValue,
    duration: duration,
    ease: 'Quad.easeOut',
    onUpdate: () => {
      textObject.setText(`${prefix}${Math.floor(obj.value).toLocaleString()}${suffix}`);
    }
  });
}

/**
 * Create a toast notification that slides in and fades out
 * @param {Phaser.Scene} scene - The scene
 * @param {string} message - The message to display
 * @param {Object} options - Configuration options
 */
export function showToast(scene, message, options = {}) {
  const {
    duration = 2000,
    bgColor = 0x37352f,
    textColor = '#ffffff',
    y = 100,
  } = options;

  const width = window.innerWidth;

  const container = scene.add.container(width + 150, y);

  const bg = scene.add.graphics();
  const text = scene.add.text(0, 0, message, {
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
    fontSize: '14px',
    fill: textColor,
  }).setOrigin(0.5);

  const padding = 16;
  const bgWidth = text.width + padding * 2;
  const bgHeight = text.height + padding;

  bg.fillStyle(bgColor, 0.95);
  bg.fillRoundedRect(-bgWidth / 2, -bgHeight / 2, bgWidth, bgHeight, 6);

  container.add([bg, text]);

  // Slide in
  scene.tweens.add({
    targets: container,
    x: width - bgWidth / 2 - 20,
    duration: 300,
    ease: 'Back.easeOut',
  });

  // Slide out after duration
  scene.time.delayedCall(duration, () => {
    scene.tweens.add({
      targets: container,
      x: width + 150,
      alpha: 0,
      duration: 300,
      ease: 'Quad.easeIn',
      onComplete: () => container.destroy(),
    });
  });

  return container;
}
