PROJNAME := ea-blog-review

export: images/api.tar

images/%.tar: $(wildcard docker/$(basename $(notdir $@))/**) \
              $(wildcard $(basename $(notdir $@))/**)
	mkdir -p images
	docker build --tag  $(PROJNAME)-$(basename $(notdir $@)) \
               --file docker/Dockerfile .
	docker save --output $@ $(PROJNAME)-$(basename $(notdir $@))

up: 
	docker-compose --project-name $(PROJNAME) \
								-f ./docker/docker-compose.yml down && \
	docker volume create nodemodules && \
	docker-compose --project-name $(PROJNAME) \
								-f ./docker/docker-compose.yml \
								-f ./docker/docker-compose.prod.yml \
								build --pull --no-cache && \
	docker-compose --project-name $(PROJNAME) \
								-f ./docker/docker-compose.yml \
								-f ./docker/docker-compose.prod.yml \
								up --no-deps 

clean:
	rm -rf images
