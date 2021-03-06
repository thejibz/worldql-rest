.PHONY : install push force_push

install:
	rm -f yarn.lock || true
	yarn install

start:
	 DEBUG="worlql-rest:*" nodemon ./bin/www

test:
	yarn test

push:
	$(MAKE) test
	git add .
	git status
	git commit -m"[sync]"|| true 
	git push -u origin master

force_push:
	$(MAKE) test
	git add .
	git status
	git commit -m"[sync]"|| true 
	git push -f -u origin master
