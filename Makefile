TARGETS := darwin/universal linux/amd64 linux/arm64 windows/amd64 windows/arm64 windows/386

define build_release
$(if $(findstring darwin,$(1)),\
	wails build -platform $(1) -o pillbox-$(subst /,-,$(1)).app,\
	$(if $(findstring windows,$(1)),\
		wails build -platform $(1) -o pillbox-$(subst /,-,$(1)).exe,\
		wails build -platform $(1) -o pillbox-$(subst /,-,$(1))\
	)\
)
endef

.PHONY: release
build: clean
	wails build -clean
	$(foreach target,$(TARGETS),$(call build_release,$(target));)

.PHONY: clean
clean:
	rm -rf build