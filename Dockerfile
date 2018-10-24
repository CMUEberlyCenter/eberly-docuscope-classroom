FROM node:latest
WORKDIR /classroom
COPY ./classroom .
RUN npm i && npm run build --prod

FROM tiangolo/uwsgi-nginx-flask:python3.7
COPY requirements.txt /tmp
RUN pip install --upgrade pip && pip install --no-cache-dir --upgrade -r /tmp/requirements.txt
ENV STATIC_INDEX 1
COPY ./app /app
COPY --from=0 /classroom/dist/classroom /app/static
