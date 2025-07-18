import { act } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { useQuitGame } from './use-quit-game.tsx';
import { renderHookWithContext } from '../../../test/render-hook-with-context.tsx';
import * as contextHooks from '../../hooks/context.tsx';
import * as fadeCanvasHooks from '../../hooks/use-fade-canvas.tsx';

import type { GBAEmulator } from '../../emulator/mgba/mgba-emulator.tsx';

describe('useQuitGame hook', () => {
  it('quits game if the emulator exists', async () => {
    const emulatorQuitGameSpy: () => void = vi.fn();
    const screenshotSpy: (fileName?: string) => boolean = vi.fn(() => true);
    const getFileSpy: (p: string) => Uint8Array = vi.fn(() =>
      new TextEncoder().encode('Some screenshot file contents')
    );
    const deleteFileSpy: (filePath: string) => void = vi.fn();
    const setIsRunningSpy = vi.fn();
    const startFadeSpy = vi.fn();
    const cancelFadeSpy = vi.fn();
    const testCanvas = {} as HTMLCanvasElement;
    // must be stable
    const emu = {
      quitGame: emulatorQuitGameSpy,
      screenshot: screenshotSpy,
      filePaths: () => ({
        screenshotsPath: '/screenshots'
      }),
      getFile: getFileSpy,
      deleteFile: deleteFileSpy
    } as GBAEmulator;

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      setCanvas: vi.fn(),
      canvas: testCanvas,
      emulator: emu
    }));

    vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
      isRunning: true,
      setIsRunning: setIsRunningSpy
    }));

    vi.spyOn(fadeCanvasHooks, 'useFadeCanvas').mockImplementation(() => ({
      startFade: startFadeSpy,
      cancelFade: cancelFadeSpy
    }));

    const { result } = renderHookWithContext(() => useQuitGame());

    act(() => {
      result.current();
    });

    expect(startFadeSpy).toHaveBeenCalledOnce();
    // blob is not implemented, but we can check the type
    expect(startFadeSpy).toHaveBeenCalledWith(testCanvas, new Blob());
    // if the emulator is running, it is expected that we attempt to cancel the fade
    // if the fade itself is not actively running, it is a no-op
    expect(cancelFadeSpy).toHaveBeenCalledOnce();

    expect(screenshotSpy).toHaveBeenCalledOnce();
    expect(screenshotSpy).toHaveBeenCalledWith('fade-copy.png');

    expect(getFileSpy).toHaveBeenCalledOnce();
    expect(getFileSpy).toHaveBeenCalledWith('/screenshots/fade-copy.png');

    expect(deleteFileSpy).toHaveBeenCalledOnce();
    expect(deleteFileSpy).toHaveBeenCalledWith('/screenshots/fade-copy.png');

    expect(emulatorQuitGameSpy).toHaveBeenCalledOnce();

    expect(setIsRunningSpy).toHaveBeenCalledOnce();
    expect(setIsRunningSpy).toHaveBeenCalledWith(false);
  });

  it('sets running to false if emulator is not running', () => {
    const setIsRunningSpy = vi.fn();
    const startFadeSpy = vi.fn();
    const cancelFadeSpy = vi.fn();

    vi.spyOn(contextHooks, 'useEmulatorContext').mockImplementation(() => ({
      setCanvas: vi.fn(),
      canvas: null,
      emulator: null
    }));

    vi.spyOn(contextHooks, 'useRunningContext').mockImplementation(() => ({
      isRunning: false,
      setIsRunning: setIsRunningSpy
    }));

    vi.spyOn(fadeCanvasHooks, 'useFadeCanvas').mockImplementation(() => ({
      startFade: startFadeSpy,
      cancelFade: cancelFadeSpy
    }));

    const { result } = renderHookWithContext(() => useQuitGame());

    act(() => {
      result.current();
    });

    expect(startFadeSpy).not.toHaveBeenCalled();
    expect(cancelFadeSpy).not.toHaveBeenCalled();

    expect(setIsRunningSpy).toHaveBeenCalledOnce();
    expect(setIsRunningSpy).toHaveBeenCalledWith(false);
  });
});
