/**
 *	依赖收集实现 demo
 */
const VUE = {
	data () {
		return {
			a: 1,
			b: 2,
		}
	},
	computed: {
		sum () {
			return this.a + this.b
		}
	}
}

// step0 基本的数据结构
const collection = {
	// a: {
	// 	value: 1,
	// 	getFunc: [],
	// 	setFunc: [],
	//	dependencyBy: [],
	// }
}

// 添加被依赖的属性
function addDependency (name) {
	return function (i) {
		collection[i].dependencyBy.add(name)
	}
}

// 触发computed方法
function triggerComputed (i) {
	Array.from(collection[i].dependencyBy).forEach(d => {
		collection[d].value = VUE.computed[d].call(VUE)
	})
}

// step1 实现data加上getter、setter并绑定在this上
function step1 () {
	const data = VUE.data()
	for (let i in data) {
		collection[i] = {
			value: data[i],
			getFunc: new Set(),
			setFunc: new Set(),
			dependencyBy: new Set(),
		}

		collection[i].setFunc.add(triggerComputed)

		Object.defineProperty(VUE, i, {
			get: function () {
				Array.from(collection[i].getFunc).forEach(f => {
					f.call(VUE, i)
				})
				return collection[i].value
			},
			set: function (val) {
				collection[i].value = val
				Array.from(collection[i].setFunc).forEach(f => {
					f.call(VUE, i)
				})
			},
			enumerable: true,
			configurable: false,
		})
	}
}

step1()

// step2 computed初次生成数据并且收集依赖
function step2 () {
	const computed = VUE.computed
	for (let i in computed) {
		const removeGetterList = new Set()
		for (let j in VUE.data()) {
			const _addDependency = addDependency(i)
			collection[j].getFunc.add(_addDependency)
			removeGetterList.add(function () {
				collection[j].getFunc.delete(_addDependency)
			})
		}

		collection[i] = {
			value: computed[i].call(VUE)
		}

		Object.defineProperty(VUE, i, {
			get: function () {
				return collection[i].value
			},
			set: function () {
				throw new Error('Can\'t set')
			},
			enumerable: true,
			configurable: false,
		})

		Array.from(removeGetterList).forEach(func => func())
	}
}

step2()

VUE.a = 8

console.log(VUE.sum)

VUE.sum = 666
