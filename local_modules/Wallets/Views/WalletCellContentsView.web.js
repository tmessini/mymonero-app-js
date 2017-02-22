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
const View = require('../../Views/View.web')
const commonComponents_walletIcons = require('../../WalletAppCommonComponents/walletIcons.web')
//
class WalletCellContentsView extends View
{
	constructor(options, context)
	{
		super(options, context)
		//
		const self = this
		self.setup()
	}
	setup()
	{
		const self = this
		self.setup_views()
	}
	setup_views()
	{
		const self = this
		{ 
			const layer = self.layer
			layer.style.wordBreak = "break-all" // to get the text to wrap
			layer.style.height = "100%"
			layer.style.position = "relative"
			layer.style.left = "0"
			layer.style.top = "0"
		}
		{ // icon
			const div = commonComponents_walletIcons.New_WalletIconLayer(
				"", // for now - we will config in a moment
				"large-48" // size class - for css
			) 
			div.style.position = "absolute"
			div.style.left = "15px"
			div.style.top = "16px"
			self.walletIconLayer = div
			self.layer.appendChild(div)
		}
		self.__setup_titleLayer()
		self.__setup_descriptionLayer()
	}
	__setup_titleLayer()
	{
		const self = this
		const layer = document.createElement("div")
		layer.style.position = "relative"
		layer.style.boxSizing = "border-box"
		layer.style.padding = "22px 66px 4px 80px"
		layer.style.height = "auto"
		layer.style.display = "block"
		layer.style.fontSize = "13px"
		layer.style.fontFamily = self.context.themeController.FontFamily_sansSerif()
		layer.style.fontWeight = "400"
		layer.style.wordBreak = "break-word"
		layer.style.color = "#fcfbfc"
		// layer.style.border = "1px solid red"
		self.titleLayer = layer
		self.layer.appendChild(layer)
	}
	__setup_descriptionLayer()
	{
		const self = this
		const layer = document.createElement("div")
		layer.style.position = "relative"
		layer.style.boxSizing = "border-box"
		layer.style.padding = "0px 66px 4px 80px"
		layer.style.fontSize = "13px"
		layer.style.fontFamily = self.context.themeController.FontFamily_monospace()
		layer.style.fontWeight = "100"
		layer.style.height = "20px"
		layer.style.color = "#9e9c9e"
		layer.style.whiteSpace = "nowrap"
		layer.style.overflow = "hidden"
		layer.style.textOverflow = "ellipsis"
		self.descriptionLayer = layer
		self.layer.appendChild(layer)
	}
	//
	//
	// Lifecycle - Teardown
	//
	TearDown()
	{
		super.TearDown()
		//
		const self = this
		self.stopObserving_wallet()
		self.wallet = null
	}
	//
	//
	// Internal - Teardown/Recycling
	//
	PrepareForReuse()
	{
		const self = this
		//
		self.stopObserving_wallet()
		self.wallet = null
	}
	stopObserving_wallet()
	{
		const self = this
		if (typeof self.wallet === 'undefined' || !self.wallet) {
			return
		}
		function doesListenerFunctionExist(fn)
		{
			if (typeof fn !== 'undefined' && fn !== null) {
				return true
			}
			return false
		}
		if (doesListenerFunctionExist(self.wallet_EventName_walletLabelChanged_listenerFunction) === true) {
			self.wallet.removeListener(
				self.wallet.EventName_walletLabelChanged(),
				self.wallet_EventName_walletLabelChanged_listenerFunction
			)
		}
		if (doesListenerFunctionExist(self.wallet_EventName_walletSwatchChanged_listenerFunction) === true) {
			self.wallet.removeListener(
				self.wallet.EventName_walletSwatchChanged(),
				self.wallet_EventName_walletSwatchChanged_listenerFunction
			)
		}
		if (doesListenerFunctionExist(self.wallet_EventName_balanceChanged_listenerFunction) === true) {
			self.wallet.removeListener(
				self.wallet.EventName_balanceChanged(),
				self.wallet_EventName_balanceChanged_listenerFunction
			)
		}
	}
	//
	// Interface - Runtime - Imperatives - State/UI Configuration
	//
	ConfigureWithRecord(wallet)
	{
		const self = this
		if (typeof self.wallet !== 'undefined') {
			self.PrepareForReuse()
		}
		self.wallet = wallet
		self._configureUIWithWallet()
		self.startObserving_wallet()
	}
	//
	//
	// Internal - Runtime - Imperatives - State/UI Configuration
	//
	_configureUIWithWallet()
	{
		const self = this
		self._configureUIWithWallet__accountInfo()
		self._configureUIWithWallet__color()
	}
	_configureUIWithWallet__accountInfo()
	{
		const self = this
		const wallet = self.wallet
		if (wallet.didFailToInitialize_flag == true || wallet.didFailToBoot_flag == true) { // unlikely but possible
			self.titleLayer.innerHTML = "Error: Couldn't unlock wallet. Please contact support."
			self.descriptionLayer.innerHTML = ""
		} else {
			self.titleLayer.innerHTML = wallet.walletLabel
			if (wallet.HasEverFetched_accountInfo() === false) {
				self.descriptionLayer.innerHTML = "Loading…"
			} else {
				var htmlString = `${wallet.Balance_FormattedString()} ${wallet.HumanReadable_walletCurrency()}`
				if (wallet.HasLockedFunds() === true) {
					htmlString += ` (${wallet.LockedBalance_FormattedString()} ${wallet.HumanReadable_walletCurrency()} 🔒)`
				}
				self.descriptionLayer.innerHTML = htmlString
			}
		}		
	}
	_configureUIWithWallet__color()
	{
		const self = this
		self.walletIconLayer.ConfigureWithHexColorString(self.wallet.swatch || "")
	}
	//
	//
	// Internal - Runtime - Imperatives - Wallet operations
	deleteWallet()
	{
		const self = this
		self.context.walletsListController.WhenBooted_DeleteRecordWithId(
			self.wallet._id,
			function(err)
			{
				if (err) {
					console.error("Failed to delete wallet")
					return
				}
				// this change will be picked up by the list change listener
			}
		)
	}
	//
	//
	//
	// Internal - Runtime - Imperatives - Observation
	//
	startObserving_wallet()
	{
		const self = this
		if (typeof self.wallet === 'undefined' || self.wallet === null) {
			throw "wallet undefined in start observing"
			return
		}
		// here, we're going to store a bunch of functions as instance properties
		// because if we need to stopObserving we need to have access to the listener fns
		//
		// wallet label
		self.wallet_EventName_walletLabelChanged_listenerFunction = function()
		{
			self._configureUIWithWallet__accountInfo()
		}
		self.wallet.on(
			self.wallet.EventName_walletLabelChanged(),
			self.wallet_EventName_walletLabelChanged_listenerFunction
		)
		// wallet swatch
		self.wallet_EventName_walletSwatchChanged_listenerFunction = function()
		{
			self._configureUIWithWallet__color()
		}
		self.wallet.on(
			self.wallet.EventName_walletSwatchChanged(),
			self.wallet_EventName_walletSwatchChanged_listenerFunction
		)
		// balance
		self.wallet_EventName_balanceChanged_listenerFunction = function()
		{
			self._configureUIWithWallet__accountInfo()
		}
		self.wallet.on(
			self.wallet.EventName_balanceChanged(),
			self.wallet_EventName_balanceChanged_listenerFunction
		)
	}
}
module.exports = WalletCellContentsView
