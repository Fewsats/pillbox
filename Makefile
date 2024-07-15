TARGETS := darwin/universal linux/amd64 linux/arm64 windows/amd64 windows/arm64 windows/386

define build_target
	wails build -platform $(1) -o build/pillbox-$(subst /,-,$(1))$(if $(findstring windows,$(1)),.exe,$(if $(findstring darwin,$(1)),.app,))
endef

.PHONY: release
release: clean
	$(foreach target,$(TARGETS),$(call build_target,$(target));)

.PHONY: clean
clean:
	rm -rf build