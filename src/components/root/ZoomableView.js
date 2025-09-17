// ----------    formated both finger and double tap handler -------------

import React, {useRef, useState, useEffect} from 'react';
import {Dimensions, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedGestureHandler,
  useAnimatedStyle,
  withTiming,
  withDecay,
  runOnJS,
} from 'react-native-reanimated';
import {
  GestureHandlerRootView,
  PanGestureHandler,
  PinchGestureHandler,
  TapGestureHandler,
} from 'react-native-gesture-handler';

const MIN_SCALE = 1;
const MAX_SCALE = 4;

// Helper: Clamp function moved outside component to avoid redeclaration
const clamp = (value, min, max) => {
  'worklet';
  return Math.min(Math.max(value, min), max);
};

export default function ZoomableView({children, simultaneousHandlers}) {
  // Track screen dimensions dynamically to handle orientation changes
  const [screenDimensions, setScreenDimensions] = useState(
    Dimensions.get('window'),
  );

  useEffect(() => {
    const onChange = ({window}) => {
      setScreenDimensions(window);
    };
    const subscription = Dimensions.addEventListener('change', onChange);
    return () => {
      if (subscription?.remove) {
        subscription.remove();
      } else {
        // For older RN versions
        Dimensions.removeEventListener('change', onChange);
      }
    };
  }, []);

  const {width: SCREEN_WIDTH, height: SCREEN_HEIGHT} = screenDimensions;

  const scale = useSharedValue(1);
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);

  const doubleTapRef = useRef();
  const panRef = useRef();
  const pinchRef = useRef();

  const [isZoomed, setIsZoomed] = useState(false);

  // Pinch gesture handler
  const pinchHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      ctx.startScale = scale.value;
      // Debug log for pinch start
      // console.log('Pinch start, startScale:', ctx.startScale);
    },
    onActive: (event, ctx) => {
      // Calculate new scale with clamp
      let newScale = ctx.startScale * event.scale;
      newScale = clamp(newScale, MIN_SCALE, MAX_SCALE);

      // Apply small threshold to reduce jitter on tiny scale changes
      if (Math.abs(newScale - scale.value) > 0.01) {
        scale.value = newScale;
        runOnJS(setIsZoomed)(newScale > MIN_SCALE);
        // Debug log for pinch active
        // console.log('Pinch active, scale:', newScale);
      }
    },
    onEnd: () => {
      // Animate scale back to bounds if out of range
      if (scale.value < MIN_SCALE) {
        scale.value = withTiming(MIN_SCALE);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        runOnJS(setIsZoomed)(false);
      } else if (scale.value > MAX_SCALE) {
        scale.value = withTiming(MAX_SCALE);
        runOnJS(setIsZoomed)(true);
      }
      // Debug log for pinch end
      // console.log('Pinch end, final scale:', scale.value);
    },
  });

  // Pan gesture handler - only active when zoomed in
  const panHandler = useAnimatedGestureHandler({
    onStart: (_, ctx) => {
      if (!isZoomed) return;
      ctx.startX = translateX.value;
      ctx.startY = translateY.value;
    },
    onActive: (event, ctx) => {
      if (!isZoomed) return;

      const boundX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
      const boundY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

      let newX = ctx.startX + event.translationX;
      let newY = ctx.startY + event.translationY;

      // Clamp translation to bounds so content doesn't move out of view
      newX = clamp(newX, -boundX, boundX);
      newY = clamp(newY, -boundY, boundY);

      translateX.value = newX;
      translateY.value = newY;
    },
    onEnd: event => {
      if (!isZoomed) return;

      const boundX = (SCREEN_WIDTH * (scale.value - 1)) / 2;
      const boundY = (SCREEN_HEIGHT * (scale.value - 1)) / 2;

      // Add decay animation with clamping to simulate natural momentum
      translateX.value = withDecay({
        velocity: event.velocityX,
        clamp: [-boundX, boundX],
      });
      translateY.value = withDecay({
        velocity: event.velocityY,
        clamp: [-boundY, boundY],
      });
    },
  });

  // Double tap gesture handler to toggle zoom
  const doubleTapHandler = useAnimatedGestureHandler({
    onActive: event => {
      if (scale.value > MIN_SCALE) {
        // Zoom out to minimum scale
        scale.value = withTiming(MIN_SCALE);
        translateX.value = withTiming(0);
        translateY.value = withTiming(0);
        runOnJS(setIsZoomed)(false);
      } else {
        // Zoom in to scale 2, centered on tap location
        scale.value = withTiming(2);
        const offsetX = SCREEN_WIDTH / 2 - event.x;
        const offsetY = SCREEN_HEIGHT / 2 - event.y;
        translateX.value = withTiming(offsetX);
        translateY.value = withTiming(offsetY);
        runOnJS(setIsZoomed)(true);
      }
    },
  });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [
      {translateX: translateX.value},
      {translateY: translateY.value},
      {scale: scale.value},
    ],
  }));

  return (
    <GestureHandlerRootView style={styles.container}>
      <TapGestureHandler
        onGestureEvent={doubleTapHandler}
        numberOfTaps={2}
        maxDelayMs={250}
        ref={doubleTapRef}
        simultaneousHandlers={simultaneousHandlers}>
        <Animated.View style={{flex: 1}}>
          <PanGestureHandler
            enabled={isZoomed}
            onGestureEvent={panHandler}
            minPointers={1}
            maxPointers={2}
            ref={panRef}
            simultaneousHandlers={[
              pinchRef,
              doubleTapRef,
              simultaneousHandlers,
            ]}>
            <Animated.View style={{flex: 1}}>
              <PinchGestureHandler
                onGestureEvent={pinchHandler}
                ref={pinchRef}
                simultaneousHandlers={[
                  panRef,
                  doubleTapRef,
                  simultaneousHandlers,
                ]}>
                <Animated.View style={[{flex: 1}, animatedStyle]}>
                  {children}
                </Animated.View>
              </PinchGestureHandler>
            </Animated.View>
          </PanGestureHandler>
        </Animated.View>
      </TapGestureHandler>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1},
});
