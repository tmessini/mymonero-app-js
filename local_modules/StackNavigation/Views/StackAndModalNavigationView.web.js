// Copyright (c) 2014-2017, MyMonero.com
//
// All rights reserved.
//
// Redistribution and use in source and binary forms, with or without modification, are
// permitted provided that the following conditions are met:
//
// 1. Redistributions of source code must retain the above copyright notice, this list of
//	conditions and the following disclaimer.
//
// 2. Redistributions in binary form must reproduce the above copyright notice, this list
//	of conditions and the following disclaimer in the documentation and/or other
//	materials provided with the distribution.
//
// 3. Neither the name of the copyright holder nor the names of its contributors may be
//	used to endorse or promote products derived from this software without specific
//	prior written permission.
//
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS" AND ANY
// EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE IMPLIED WARRANTIES OF
// MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE ARE DISCLAIMED. IN NO EVENT SHALL
// THE COPYRIGHT HOLDER OR CONTRIBUTORS BE LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL,
// SPECIAL, EXEMPLARY, OR CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO,
// PROCUREMENT OF SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN CONTRACT,
// STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE) ARISING IN ANY WAY OUT OF
// THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE POSSIBILITY OF SUCH DAMAGE.
//
"use strict"
//
const Animate = require('velocity-animate')
//
const StackNavigationView = require('./StackNavigationView.web')
//
class StackAndModalNavigationView extends StackNavigationView
{
	setup()
	{
		super.setup()
		//
		const self = this
		{ // initial state
			self.modalViews = []
			self.topModalView = null
			//
			self.modalViews_scrollOffsetsOnPushedFrom_byViewUUID = {}
		}
	}
	//
	//
	//
	// Runtime - Accessors - Internal - UI & UI metrics - Shared
	//
	_animationDuration_ms_modalPresent()
	{
		return 170
	}
	//
	//
	// Runtime - Imperatives - Modal presentation & dismissal
	//
	PresentView(
		modalView,
		isAnimated_orTrue // defaults to true if you don't pass anything here
	)
	{
		const self = this
		if (modalView === null || typeof modalView === 'undefined') {
			throw "StackNavigationView asked to PresentView nil modalView"
			return
		}
		const isAnimated =
			isAnimated_orTrue === true
			 || typeof isAnimated_orTrue === 'undefined'
			 || isAnimated_orTrue == null
			? true /* default true */
			: false
		//
		const old_topStackView = self.topStackView
		const old_topModalView = self.topModalView
		const old_topModalOrStackView = old_topModalView ? old_topModalView : old_topStackView
		const old_topModalOrStackView_wasModal = old_topModalView ? true : false
		//
		{ // make modalView the new top view
			modalView.modalParentView = self
			self.modalViews.push(modalView)
			self.topModalView = modalView
		}
		{ // and then actually present the view:
			const modalView_layer = modalView.layer
			if (isAnimated === true) { // prepare for animation
				if (typeof old_topModalView !== 'undefined' && old_topModalView) {
					old_topModalView.layer.style.position = "absolute"
					old_topModalView.layer.style.zIndex = "9"
				}
				modalView_layer.style.position = "absolute"
				modalView_layer.style.zIndex = "20" // 2 because we'll want to insert a semi-trans curtain view under the modalView_layer above the old_topStackView
				modalView_layer.style.top = `${ self.layer.offsetHeight }px`
			}
			self.addSubview(modalView)
			if (isAnimated === false) { // no need to animate anything - straight to end state
				_afterHavingFullyPresentedNewModalView_removeOldTopModalView()
			} else {
				setTimeout(
					function()
					{ // wait til not blocked or animation is choppy
						Animate(
							modalView_layer,
							{
								top: "0px"
							},
							{
								duration: self._animationDuration_ms_modalPresent(),
								easing: "ease-in-out",
								complete: function()
								{
									modalView_layer.style.zIndex = "10"
									_afterHavingFullyPresentedNewModalView_removeOldTopModalView()
								}
							}
						)
					}
				)
			}
		}
		function _afterHavingFullyPresentedNewModalView_removeOldTopModalView()
		{
			if (old_topModalView && typeof old_topModalView !== 'undefined') {
				// before we remove the old_topModalOrStackView, let's record its styling if it's a modal, which would be lost on removal like scroll offset
				self.modalViews_scrollOffsetsOnPushedFrom_byViewUUID[old_topModalView.View_UUID()] =
				{
					Left: old_topModalView.layer.scrollLeft,
					Top: old_topModalView.layer.scrollTop
				}
				old_topModalView.removeFromSuperview()
			}
		}
	}
	DismissTopModalView(
		isAnimated_orTrue
	)
	{
		const self = this
		const numberOf_modalViews = self.modalViews.length
		if (numberOf_modalViews == 0) {
			throw "DismissTopModalView called with 0 self.modalViews"
			return
		}
		if (numberOf_modalViews == 1) { // then pop all modals
			self.DismissModalViewsToView(
				null,
				isAnimated_orTrue
			)
			return
		}
		const indexOf_justPrevious_modalView = numberOf_modalViews - 2
		const justPrevious_modalView = self.modalViews[indexOf_justPrevious_modalView]
		self.DismissModalViewsToView(
			justPrevious_modalView,
			isAnimated_orTrue
		)
	}
	DismissModalViewsToView(
		to_modalView_orNullForTopStackView,
		isAnimated_orTrue
	)
	{
		const self = this
		const isAnimated =
			isAnimated_orTrue === true
			 || typeof isAnimated_orTrue === 'undefined'
			 || isAnimated_orTrue == null
			? true /* default true */
			: false
		const old_topModalView = self.topModalView
		if (typeof old_topModalView === 'undefined' || old_topModalView == null) {
			throw self.constructor.name + " DismissModalViewsToView requires there to be a modal view"
		}
		function _afterHavingFullyPresentedNewTopView_removeOldTopModalView()
		{
			// console.log("old_topModalView" , old_topModalView.Description())
			old_topModalView.removeFromSuperview()
			old_topModalView.modalParentView = null
		}
		if (to_modalView_orNullForTopStackView === null) { // pop all modalViews to top stackView
			old_topModalView.layer.style.position = "absolute"
			old_topModalView.layer.style.zIndex = "9"
			//
			self.modalViews.forEach(
				function(modalView, i)
				{
					modalView.modalParentView = null
				}
			)
			self.modalViews = [] // free
			self.topModalView = null
			//
			if (isAnimated === false) { // no need to animate anything - straight to end state
				_afterHavingFullyPresentedNewTopView_removeOldTopModalView()
			} else {
				setTimeout(
					function()
					{ // wait til not blocked or we get choppiness
						Animate(
							old_topModalView.layer,
							{
								top: `${self.layer.offsetHeight}px`
							},
							{
								duration: self._animationDuration_ms_modalPresent(),
								easing: "ease-in-out",
								complete: function()
								{
									_afterHavingFullyPresentedNewTopView_removeOldTopModalView()
								}
							}
						)
					}
				)
			}
			return
		}
		const numberOf_modalViews = self.modalViews.length
		const to_modalView = to_modalView_orNullForTopStackView // because we know now it's not null
		var indexOf_to_modalView = -1 // to find:
		for (var i = 0 ; i < numberOf_modalViews ; i++) {
			const modalView = self.modalViews[i]
			if (modalView.IsEqualTo(to_modalView) === true) {
				indexOf_to_modalView = i
				break
			}
		}
		if (indexOf_to_modalView === -1) {
			throw "to_modalView not found in self.modalViews"
			return
		}
		{ // make to_modalView the new top view
			self.topModalView = to_modalView
		}
		{ // pre-insert the new top view, to_modalView, underneath the old_topModalView
			const subviewUUIDs = self.subviews.map(function(v) { return v.View_UUID() })
			// console.log("subviewUUIDs", subviewUUIDs)
			const indexOf_old_topModalView_inSubviews = subviewUUIDs.indexOf(old_topModalView.View_UUID())
			if (indexOf_old_topModalView_inSubviews === -1) {
				throw `Asked to DismissModalViewsToView ${to_modalView.View_UUID()} but old_topModalView UUID not found in UUIDs of ${self.Description()} subviews.`
				return
			}
			// console.log("indexOf_old_topStackView_inSubviews" , indexOf_old_topStackView_inSubviews)
			if (isAnimated === true) { // prepare for animation
				old_topModalView.layer.style.position = "absolute"
				old_topModalView.layer.style.zIndex = "20" // starts out on top, as it would if we inserted to_modalView under it
				//
				to_modalView.layer.style.position = "absolute"
				to_modalView.layer.style.zIndex = "9" // because we want to make sure it goes under the current top modal view
			}
			self.stackViewStageView.insertSubview(
				to_modalView,
				indexOf_old_topModalView_inSubviews
			)
			{ // and reconstitute lost/held styling such as scroll offset
				const to_modalView_View_UUID = to_modalView.View_UUID()
				const to_modalView_scrollOffsetsOnPushedFrom = self.modalViews_scrollOffsetsOnPushedFrom_byViewUUID[to_modalView_View_UUID]
				{
					const cached_to_modalView__Left = to_modalView_scrollOffsetsOnPushedFrom.Left
					const cached_to_modalView__Top = to_modalView_scrollOffsetsOnPushedFrom.Top
					to_modalView.layer.scrollLeft = cached_to_modalView__Left
					to_modalView.layer.scrollTop = cached_to_modalView__Top
				}
				delete self.modalViews_scrollOffsetsOnPushedFrom_byViewUUID[to_modalView_View_UUID] // free
			}
			if (isAnimated === false) { // no need to animate anything - straight to end state
				_afterHavingFullyPresentedNewTopView_removeOldTopModalView()
			} else { // else not return because we need to continue executing parent fn to get to btm, e.g. for model update and nav bar update
				setTimeout(
					function()
					{ // wait til not blocked or we get choppiness
						Animate(
							old_topStackView.layer,
							{
								top: `${self.layer.offsetHeight}px`
							},
							{
								duration: self._animationDuration_ms_modalPresent(),
								easing: "ease-in-out",
								complete: function()
								{
									_afterHavingFullyPresentedNewTopView_removeOldTopModalView()
								}
							}
						)
					}
				)
			}
		}
		{ // pop all views in model
			const numberOf_modalViews = self.modalViews.length
			for (var i = indexOf_to_modalView + 1 ; i < numberOf_modalViews ; i++) { // over the modalViews which will be popped
				const modalView = self.modalViews[i]
				modalView.modalParentView = null // un-set modalParentView on this modalView which will be popped
			}
			const modalViews_afterPop = self.modalViews.slice(0, indexOf_to_modalView + 1) // +1 as end is end idx not included in slice
			self.modalViews = modalViews_afterPop
			if (to_modalView.IsEqualTo(self.modalViews[self.modalViews.length - 1]) === false) {
				throw `Popped to to_modalView ${to_modalView.Description()} at idx ${indexOf_to_modalView} but it was not the last of self.modalViews after pop all views until that idx.`
				return
			}
		}
	}
	//
	//
	// Runtime - Imperatives - Overrides - Disallowing stackView operations while modal is up - not sure if these are strictly necessary
	//
	SetStackViews(to_stackViews)
	{
		const self = this
		if (self.modalViews.length != 0) {
			console.warn(`⚠️  Disallowing ${self.constructor.name}/SetStackViews while modal view(s) presented.`)
			return
		}
		super.SetStackViews(to_stackViews)
	}
	PushView(
		stackView,
		isAnimated_orTrue
	)
	{
		const self = this
		if (self.modalViews.length != 0) {
			console.warn(`⚠️  Disallowing ${self.constructor.name}/PushView while modal view(s) presented.`)
			return
		}
		super.PushView(stackView, isAnimated_orTrue)
	}
	PopToView(
		to_stackView,
		indexOf_to_stackView,
		isAnimated_orTrue
	)
	{
		const self = this
		if (self.modalViews.length != 0) {
			console.warn(`⚠️  Disallowing ${self.constructor.name}/PopToView while modal view(s) presented.`)
			return
		}
		super.PopToView(to_stackView, indexOf_to_stackView, isAnimated_orTrue)
	}
	PopToRootView(
		isAnimated_orTrue
	)
	{
		const self = this
		if (self.modalViews.length != 0) {
			console.warn(`⚠️  Disallowing ${self.constructor.name}/PopToRootView while modal view(s) presented.`)
			return
		}
		super.PopToRootView(isAnimated_orTrue)
	}
}
module.exports = StackAndModalNavigationView