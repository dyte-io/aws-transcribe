import { EventEmitter } from 'events';

const mediaStreamEmitter = new EventEmitter();

const emitter = () => mediaStreamEmitter;

export default emitter;
