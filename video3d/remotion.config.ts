import { Config } from '@remotion/cli/config';

// Renderização WebGL em software (funciona em qualquer PC, sem GPU dedicada).
Config.setChromiumOpenGlRenderer('angle');
Config.setVideoImageFormat('jpeg');
Config.setJpegQuality(92);
Config.setOverwriteOutput(true);

// Máquinas lentas: o navegador do render pode demorar a arrancar (o padrão de 30 s falhava).
Config.setDelayRenderTimeoutInMilliseconds(180000);
