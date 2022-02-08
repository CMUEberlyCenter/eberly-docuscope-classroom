FROM docker.io/node:latest AS builder
WORKDIR /tmp
COPY ./classroom/package*.json /tmp/
RUN npm ci
RUN mkdir -p /classroom && cp -a /tmp/node_modules /classroom
WORKDIR /classroom
COPY ./classroom .
RUN npm run version # Make sure version is up to date.
RUN npm run build:deploy

FROM docker.io/python:latest AS base 
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONFAULTHANDLER=1

FROM base AS deps
RUN pip install --upgrade pip
RUN pip install pipenv
COPY ./Pipfile .
COPY ./Pipfile.lock .
RUN PIPENV_VENV_IN_PROJECT=1 pipenv install --deploy

FROM base
ARG BRANCH="master"
ARG COMMIT=""
ARG TAG="latest"
ARG USER=""
LABEL branch=${BRANCH}
LABEL commit=${COMMIT}
LABEL maintainer=${USER}
LABEL version=${TAG}
LABEL description="DocuScope Classroom visualization tools web interface"
COPY --from=deps /.venv /.venv
ENV PATH="/.venv/bin:$PATH"
RUN useradd --create-home appuser
WORKDIR /home/appuser
COPY ./app .
COPY --from=builder /classroom/dist/classroom ./static
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "80"]
