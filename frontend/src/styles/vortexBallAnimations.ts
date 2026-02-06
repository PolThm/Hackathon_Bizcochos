/**
 * Golden ratio inspired vortex ball animations.
 * 20 keyframe points for smooth, fluid trajectories from center to corners.
 */

const VORTEX_BALL_ANIMATION = {
  duration: '2.2s',
  easing: 'ease-in',
  delayTopRight: '0.6s',
  delayBottomLeft: '0.8s',
} as const;

export const vortexBallTopRightKeyframes = {
  '@keyframes vortexBallTopRight': {
    '0%': {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%) scale(0.12)',
      opacity: 0,
    },
    '5%': {
      left: '50.5%',
      top: '46%',
      transform: 'translate(-50%, -50%) scale(0.2)',
      opacity: 0.01,
    },
    '10%': {
      left: '51%',
      top: '43%',
      transform: 'translate(-50%, -50%) scale(0.28)',
      opacity: 0.02,
    },
    '15%': {
      left: '51.5%',
      top: '39%',
      transform: 'translate(-50%, -50%) scale(0.35)',
      opacity: 0.03,
    },
    '20%': {
      left: '52.5%',
      top: '35%',
      transform: 'translate(-50%, -50%) scale(0.42)',
      opacity: 0.04,
    },
    '25%': {
      left: '54%',
      top: '30%',
      transform: 'translate(-50%, -50%) scale(0.5)',
      opacity: 0.05,
    },
    '30%': {
      left: '55.5%',
      top: '27%',
      transform: 'translate(-50%, -50%) scale(0.57)',
      opacity: 0.058,
    },
    '35%': {
      left: '57%',
      top: '24%',
      transform: 'translate(-50%, -50%) scale(0.63)',
      opacity: 0.065,
    },
    '40%': {
      left: '58.5%',
      top: '22%',
      transform: 'translate(-50%, -50%) scale(0.68)',
      opacity: 0.07,
    },
    '45%': {
      left: '60%',
      top: '20%',
      transform: 'translate(-50%, -50%) scale(0.73)',
      opacity: 0.078,
    },
    '50%': {
      left: '62%',
      top: '18%',
      transform: 'translate(-50%, -50%) scale(0.78)',
      opacity: 0.083,
    },
    '55%': {
      left: '64%',
      top: '17%',
      transform: 'translate(-50%, -50%) scale(0.82)',
      opacity: 0.088,
    },
    '60%': {
      left: '66%',
      top: '16.5%',
      transform: 'translate(-50%, -50%) scale(0.86)',
      opacity: 0.091,
    },
    '65%': {
      left: '68%',
      top: '16%',
      transform: 'translate(-50%, -50%) scale(0.89)',
      opacity: 0.094,
    },
    '70%': {
      left: '70%',
      top: '15.5%',
      transform: 'translate(-50%, -50%) scale(0.92)',
      opacity: 0.096,
    },
    '75%': {
      left: '71.5%',
      top: '15%',
      transform: 'translate(-50%, -50%) scale(0.95)',
      opacity: 0.098,
    },
    '80%': {
      left: '73%',
      top: '15%',
      transform: 'translate(-50%, -50%) scale(0.97)',
      opacity: 0.099,
    },
    '85%': {
      left: '74%',
      top: '15%',
      transform: 'translate(-50%, -50%) scale(0.98)',
      opacity: 0.1,
    },
    '90%': {
      left: '74.5%',
      top: '15%',
      transform: 'translate(-50%, -50%) scale(0.99)',
      opacity: 0.1,
    },
    '95%': {
      left: '74.8%',
      top: '15%',
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 0.1,
    },
    '100%': {
      left: '75%',
      top: '15%',
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 0.1,
    },
  },
};

export const vortexBallBottomLeftKeyframes = {
  '@keyframes vortexBallBottomLeft': {
    '0%': {
      left: '50%',
      top: '50%',
      transform: 'translate(-50%, -50%) scale(0.12)',
      opacity: 0,
    },
    '5%': {
      left: '47%',
      top: '53%',
      transform: 'translate(-50%, -50%) scale(0.2)',
      opacity: 0.005,
    },
    '10%': {
      left: '45%',
      top: '57%',
      transform: 'translate(-50%, -50%) scale(0.28)',
      opacity: 0.01,
    },
    '15%': {
      left: '42%',
      top: '61%',
      transform: 'translate(-50%, -50%) scale(0.35)',
      opacity: 0.015,
    },
    '20%': {
      left: '39%',
      top: '65%',
      transform: 'translate(-50%, -50%) scale(0.42)',
      opacity: 0.02,
    },
    '25%': {
      left: '36%',
      top: '69%',
      transform: 'translate(-50%, -50%) scale(0.5)',
      opacity: 0.025,
    },
    '30%': {
      left: '33%',
      top: '73%',
      transform: 'translate(-50%, -50%) scale(0.57)',
      opacity: 0.03,
    },
    '35%': {
      left: '30%',
      top: '75%',
      transform: 'translate(-50%, -50%) scale(0.63)',
      opacity: 0.034,
    },
    '40%': {
      left: '28%',
      top: '77%',
      transform: 'translate(-50%, -50%) scale(0.68)',
      opacity: 0.037,
    },
    '45%': {
      left: '26%',
      top: '78.5%',
      transform: 'translate(-50%, -50%) scale(0.73)',
      opacity: 0.04,
    },
    '50%': {
      left: '25%',
      top: '80%',
      transform: 'translate(-50%, -50%) scale(0.78)',
      opacity: 0.042,
    },
    '55%': {
      left: '23.5%',
      top: '81%',
      transform: 'translate(-50%, -50%) scale(0.82)',
      opacity: 0.044,
    },
    '60%': {
      left: '22.5%',
      top: '82%',
      transform: 'translate(-50%, -50%) scale(0.86)',
      opacity: 0.046,
    },
    '65%': {
      left: '21.5%',
      top: '82.5%',
      transform: 'translate(-50%, -50%) scale(0.89)',
      opacity: 0.047,
    },
    '70%': {
      left: '21%',
      top: '83%',
      transform: 'translate(-50%, -50%) scale(0.92)',
      opacity: 0.048,
    },
    '75%': {
      left: '20.5%',
      top: '83%',
      transform: 'translate(-50%, -50%) scale(0.95)',
      opacity: 0.049,
    },
    '80%': {
      left: '20.2%',
      top: '83%',
      transform: 'translate(-50%, -50%) scale(0.97)',
      opacity: 0.05,
    },
    '85%': {
      left: '20.1%',
      top: '83%',
      transform: 'translate(-50%, -50%) scale(0.98)',
      opacity: 0.05,
    },
    '90%': {
      left: '20%',
      top: '83%',
      transform: 'translate(-50%, -50%) scale(0.99)',
      opacity: 0.05,
    },
    '95%': {
      left: '20%',
      top: '83%',
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 0.05,
    },
    '100%': {
      left: '20%',
      top: '83%',
      transform: 'translate(-50%, -50%) scale(1)',
      opacity: 0.05,
    },
  },
};

export const vortexBallAnimations = {
  ...vortexBallTopRightKeyframes,
  ...vortexBallBottomLeftKeyframes,
};

export const vortexBallAnimationConfig = VORTEX_BALL_ANIMATION;
