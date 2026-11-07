import { Config } from '@remotion/cli/config';

// Renderização WebGL em software (funciona em qualquer PC, sem GPU dedicada).
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);
