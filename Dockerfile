# Usamos Nginx para servir archivos estáticos
FROM nginx:alpine

# Copiamos los archivos HTML, CSS y JS al directorio donde Nginx los sirve
COPY . /usr/share/nginx/html

# Copiamos plantilla de configuración
COPY nginx.conf /etc/nginx/templates/default.conf.template

# Reemplaza la variable PORT de Railway y arranca Nginx
CMD envsubst '$PORT' < /etc/nginx/templates/default.conf.template > /etc/nginx/conf.d/default.conf \
    && nginx -g 'daemon off;'
