import { app } from './app';
import { env } from './env';

app.listen({
    port: parseInt(env.PORT),
}).then(() => {
    console.log('Servidor HTTP Iniciado');
});
